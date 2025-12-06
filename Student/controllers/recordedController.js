const contentModel = require('../../Teacher/models/contentModel');
const courseModel = require('../../Teacher/models/courseModel');
const studentModel = require('../models/studentModel');

exports.getRecordedSessions = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { db } = require('../../config/Firebase');
    const snapshot = await db.collection('recorded_lectures')
      .where('orgId', '==', student.orgId)
      .orderBy('createdAt', 'desc')
      .get();

    const recordings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const recordingsWithCourseInfo = await Promise.all(
      recordings.map(async (recording) => {
        let courseInfo = null;
        if (recording.courseId) {
          const course = await courseModel.getCourseById(recording.courseId);
          if (course) {
            courseInfo = {
              courseCode: course.courseCode,
              courseName: course.courseName
            };
          }
        }
        return {
          contentId: recording.contentId,
          title: recording.title,
          description: recording.description,
          duration: recording.duration,
          courseId: recording.courseId,
          course: courseInfo,
          slidesCount: recording.slides ? recording.slides.length : 0,
          createdAt: recording.createdAt
        };
      })
    );

    res.status(200).json({ recordings: recordingsWithCourseInfo });
  } catch (error) {
    console.error('Get recorded sessions error:', error);
    res.status(500).json({ message: 'Failed to fetch recorded sessions' });
  }
};

exports.getRecordingDetails = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const recording = await contentModel.getContentById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    if (recording.orgId !== student.orgId) {
      return res.status(403).json({ message: 'Access denied to this recording' });
    }

    let courseInfo = null;
    if (recording.courseId) {
      const course = await courseModel.getCourseById(recording.courseId);
      if (course) {
        courseInfo = {
          courseCode: course.courseCode,
          courseName: course.courseName
        };
      }
    }

    res.status(200).json({
      contentId: recording.contentId,
      title: recording.title,
      description: recording.description,
      slides: recording.slides,
      audio: recording.audio,
      slideAudioMapping: recording.slideAudioMapping,
      duration: recording.duration,
      course: courseInfo,
      createdAt: recording.createdAt
    });
  } catch (error) {
    console.error('Get recording details error:', error);
    res.status(500).json({ message: 'Failed to fetch recording details' });
  }
};

exports.downloadRecording = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const recording = await contentModel.getContentById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    if (recording.orgId !== student.orgId) {
      return res.status(403).json({ message: 'Access denied to this recording' });
    }

    res.status(200).json({
      downloadPackage: {
        title: recording.title,
        slides: recording.slides,
        audio: recording.audio,
        slideAudioMapping: recording.slideAudioMapping,
        manifest: {
          version: '1.0',
          contentId: recording.contentId,
          duration: recording.duration,
          slidesCount: recording.slides.length
        }
      }
    });
  } catch (error) {
    console.error('Download recording error:', error);
    res.status(500).json({ message: 'Failed to download recording' });
  }
};