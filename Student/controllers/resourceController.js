const resourceModel = require('../../Teacher/models/resourceModel');
const courseModel = require('../../Teacher/models/courseModel');
const studentModel = require('../models/studentModel');

exports.getResources = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { search, course, category, sort } = req.query;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { db } = require('../../config/Firebase');
    let query = db.collection('resources').where('orgId', '==', student.orgId);

    if (course) {
      query = query.where('courseId', '==', course);
    }

    if (category) {
      query = query.where('resourceType', '==', category);
    }

    const snapshot = await query.get();
    let resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const searchLower = search.toLowerCase();
      resources = resources.filter(resource => 
        resource.title.toLowerCase().includes(searchLower) ||
        resource.resourceType.toLowerCase().includes(searchLower)
      );
    }

    if (sort === 'oldest') {
      resources.sort((a, b) => {
        const timeA = a.createdAt?._seconds || 0;
        const timeB = b.createdAt?._seconds || 0;
        return timeA - timeB;
      });
    } else {
      resources.sort((a, b) => {
        const timeA = a.createdAt?._seconds || 0;
        const timeB = b.createdAt?._seconds || 0;
        return timeB - timeA;
      });
    }

    const resourcesWithCourseInfo = await Promise.all(
      resources.map(async (resource) => {
        let courseInfo = null;
        if (resource.courseId) {
          const courseData = await courseModel.getCourseById(resource.courseId);
          if (courseData) {
            courseInfo = {
              courseCode: courseData.courseCode,
              courseName: courseData.courseName
            };
          }
        }
        return {
          resourceId: resource.resourceId,
          title: resource.title,
          resourceType: resource.resourceType,
          courseId: resource.courseId,
          course: courseInfo,
          fileSize: resource.fileSize,
          createdAt: resource.createdAt
        };
      })
    );

    res.status(200).json({ resources: resourcesWithCourseInfo });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

exports.getResourceDetails = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const resource = await resourceModel.getResourceById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.orgId !== student.orgId) {
      return res.status(403).json({ message: 'Access denied to this resource' });
    }

    let courseInfo = null;
    if (resource.courseId) {
      const course = await courseModel.getCourseById(resource.courseId);
      if (course) {
        courseInfo = {
          courseCode: course.courseCode,
          courseName: course.courseName
        };
      }
    }

    res.status(200).json({
      resourceId: resource.resourceId,
      title: resource.title,
      resourceType: resource.resourceType,
      course: courseInfo,
      fileUrl: resource.fileUrl,
      filename: resource.filename,
      fileSize: resource.fileSize,
      mimetype: resource.mimetype,
      createdAt: resource.createdAt
    });
  } catch (error) {
    console.error('Get resource details error:', error);
    res.status(500).json({ message: 'Failed to fetch resource details' });
  }
};

exports.downloadResource = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const resource = await resourceModel.getResourceById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.orgId !== student.orgId) {
      return res.status(403).json({ message: 'Access denied to this resource' });
    }

    res.status(200).json({
      downloadUrl: resource.fileUrl,
      filename: resource.filename,
      fileSize: resource.fileSize,
      mimetype: resource.mimetype
    });
  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({ message: 'Failed to download resource' });
  }
};

exports.getResourceCategories = async (req, res) => {
  try {
    res.status(200).json({ 
      categories: resourceModel.RESOURCE_TYPES 
    });
  } catch (error) {
    console.error('Get resource categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};