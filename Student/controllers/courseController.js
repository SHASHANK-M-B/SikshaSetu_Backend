const courseModel = require('../../Teacher/models/courseModel');
const studentModel = require('../models/studentModel');

exports.getAllCourses = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { search, filter } = req.query;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { db } = require('../../config/Firebase');
    let query = db.collection('courses').where('orgId', '==', student.orgId);

    const snapshot = await query.get();
    let courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(course => 
        course.courseName.toLowerCase().includes(searchLower) ||
        course.courseCode.toLowerCase().includes(searchLower) ||
        (course.shortDescription && course.shortDescription.toLowerCase().includes(searchLower))
      );
    }

    const coursesWithEnrollment = courses.map(course => ({
      courseId: course.courseId,
      courseName: course.courseName,
      courseCode: course.courseCode,
      shortDescription: course.shortDescription,
      createdAt: course.createdAt
    }));

    res.status(200).json({ courses: coursesWithEnrollment });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const course = await courseModel.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.orgId !== student.orgId) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    const resourceModel = require('../../Teacher/models/resourceModel');
    const contentModel = require('../../Teacher/models/contentModel');

    const resources = await resourceModel.getResourcesByCourseId(id);
    const recordedLectures = await contentModel.getContentsByCourseId(id);

    res.status(200).json({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        courseCode: course.courseCode,
        shortDescription: course.shortDescription,
        createdAt: course.createdAt
      },
      resources: resources.map(r => ({
        resourceId: r.resourceId,
        title: r.title,
        resourceType: r.resourceType,
        createdAt: r.createdAt
      })),
      recordedLectures: recordedLectures.map(c => ({
        contentId: c.contentId,
        title: c.title,
        description: c.description,
        duration: c.duration,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ message: 'Failed to fetch course details' });
  }
};

exports.enrollInCourse = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const course = await courseModel.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.orgId !== student.orgId) {
      return res.status(403).json({ message: 'Cannot enroll in course from different organization' });
    }

    const { db, admin } = require('../../config/Firebase');
    const enrollmentRef = db.collection('enrollments').doc();

    await enrollmentRef.set({
      enrollmentId: enrollmentRef.id,
      studentId,
      courseId: id,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({ message: 'Failed to enroll in course' });
  }
};