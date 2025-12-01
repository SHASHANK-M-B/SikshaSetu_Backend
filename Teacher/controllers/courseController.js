const courseModel = require('../models/courseModel');
const teacherModel = require('../models/teacherModel');

exports.createCourse = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { courseName, courseCode, shortDescription } = req.body;

    if (!courseName || !courseCode || !shortDescription) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const teacher = await teacherModel.getTeacherById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const existingCourse = await courseModel.getCourseByCode(teacherId, courseCode);
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    const course = await courseModel.createCourse({
      teacherId,
      orgId: teacher.orgId,
      courseName,
      courseCode,
      shortDescription
    });

    res.status(201).json({
      message: 'Course created successfully',
      courseId: course.courseId,
      course
    });
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ message: 'Failed to create course' });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const courses = await courseModel.getCoursesByTeacherId(teacherId);

    res.status(200).json({ courses });
  } catch (error) {
    console.error('Courses fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const course = await courseModel.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ course });
  } catch (error) {
    console.error('Course fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;
    const { courseName, courseCode, shortDescription } = req.body;

    if (!courseName || !courseCode || !shortDescription) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const course = await courseModel.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (courseCode !== course.courseCode) {
      const existingCourse = await courseModel.getCourseByCode(teacherId, courseCode);
      if (existingCourse) {
        return res.status(400).json({ message: 'Course code already exists' });
      }
    }

    await courseModel.updateCourse(id, {
      courseName,
      courseCode,
      shortDescription
    });

    res.status(200).json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Course update error:', error);
    res.status(500).json({ message: 'Failed to update course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const course = await courseModel.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await courseModel.deleteCourse(id);

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Course deletion error:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
};