const discussionModel = require('../../Teacher/models/discussionModel');
const courseModel = require('../../Teacher/models/courseModel');
const uploadMiddleware = require('../../Teacher/middlewares/uploadMiddleware');
const { bucket } = require('../../config/Firebase');

exports.createDiscussion = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { courseId, subject, title, description } = req.body;

    if (!subject || !title || !description) {
      return res.status(400).json({ message: 'Subject, title, and description are required' });
    }

    if (courseId) {
      const course = await courseModel.getCourseById(courseId);
      if (!course) {
        return res.status(400).json({ message: 'Invalid course' });
      }
    }

    const student = await require('../models/studentModel').getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      const processedFiles = await uploadMiddleware.processMultipleFiles(req.files, 'default');

      const uploadPromises = processedFiles.map(async (file) => {
        const fileName = `discussions/${Date.now()}_${file.filename}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype
          }
        });

        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return {
          fileName: file.filename,
          url: publicUrl,
          size: file.size
        };
      });

      attachments = await Promise.all(uploadPromises);
    }

    const discussion = await discussionModel.createDiscussion({
      studentId,
      studentName: student.studentName,
      courseId,
      subject,
      title,
      description,
      attachments
    });

    res.status(201).json({
      message: 'Discussion created successfully',
      discussionId: discussion.discussionId
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ message: 'Failed to create discussion' });
  }
};

exports.getMyDiscussions = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const discussions = await discussionModel.getAllDiscussions({ studentId });

    const discussionsWithCourseInfo = await Promise.all(
      discussions.map(async (discussion) => {
        let courseInfo = null;
        if (discussion.courseId) {
          const course = await courseModel.getCourseById(discussion.courseId);
          if (course) {
            courseInfo = {
              courseCode: course.courseCode,
              courseName: course.courseName
            };
          }
        }
        return {
          discussionId: discussion.discussionId,
          courseId: discussion.courseId,
          course: courseInfo,
          subject: discussion.subject,
          title: discussion.title,
          status: discussion.status,
          replyCount: discussion.replyCount || 0,
          lastReplyAt: discussion.lastReplyAt,
          createdAt: discussion.createdAt
        };
      })
    );

    res.status(200).json({ discussions: discussionsWithCourseInfo });
  } catch (error) {
    console.error('Get my discussions error:', error);
    res.status(500).json({ message: 'Failed to fetch discussions' });
  }
};

exports.getAllDiscussions = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { courseId, status } = req.query;

    const filters = {};
    if (courseId) filters.courseId = courseId;
    if (status) filters.status = status;

    const discussions = await discussionModel.getAllDiscussions(filters);

    const discussionsWithCourseInfo = await Promise.all(
      discussions.map(async (discussion) => {
        let courseInfo = null;
        if (discussion.courseId) {
          const course = await courseModel.getCourseById(discussion.courseId);
          if (course) {
            courseInfo = {
              courseCode: course.courseCode,
              courseName: course.courseName
            };
          }
        }
        return {
          discussionId: discussion.discussionId,
          studentId: discussion.studentId,
          studentName: discussion.studentName,
          courseId: discussion.courseId,
          course: courseInfo,
          subject: discussion.subject,
          title: discussion.title,
          status: discussion.status,
          replyCount: discussion.replyCount || 0,
          lastReplyAt: discussion.lastReplyAt,
          createdAt: discussion.createdAt
        };
      })
    );

    res.status(200).json({ discussions: discussionsWithCourseInfo });
  } catch (error) {
    console.error('Get all discussions error:', error);
    res.status(500).json({ message: 'Failed to fetch discussions' });
  }
};

exports.getDiscussionThread = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const discussion = await discussionModel.getDiscussionById(id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const replies = await discussionModel.getRepliesByDiscussionId(id);

    let courseInfo = null;
    if (discussion.courseId) {
      const course = await courseModel.getCourseById(discussion.courseId);
      if (course) {
        courseInfo = {
          courseCode: course.courseCode,
          courseName: course.courseName
        };
      }
    }

    res.status(200).json({
      discussion: {
        ...discussion,
        course: courseInfo
      },
      replies
    });
  } catch (error) {
    console.error('Get discussion thread error:', error);
    res.status(500).json({ message: 'Failed to fetch discussion thread' });
  }
};

exports.replyToDiscussion = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;
    const { messageText } = req.body;

    if (!messageText) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const discussion = await discussionModel.getDiscussionById(id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const student = await require('../models/studentModel').getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      const processedFiles = await uploadMiddleware.processMultipleFiles(req.files, 'default');

      const uploadPromises = processedFiles.map(async (file) => {
        const fileName = `discussions/${id}/replies/${file.filename}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype
          }
        });

        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return {
          fileName: file.filename,
          url: publicUrl,
          size: file.size
        };
      });

      attachments = await Promise.all(uploadPromises);
    }

    const reply = await discussionModel.createReply({
      discussionId: id,
      userId: studentId,
      userName: student.studentName,
      role: 'student',
      messageText,
      attachments
    });

    res.status(201).json({
      message: 'Reply posted successfully',
      reply
    });
  } catch (error) {
    console.error('Reply to discussion error:', error);
    res.status(500).json({ message: 'Failed to post reply' });
  }
};

exports.markResolved = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const discussion = await discussionModel.getDiscussionById(id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.studentId !== studentId) {
      return res.status(403).json({ message: 'Only the discussion creator can mark as resolved' });
    }

    await discussionModel.updateDiscussionStatus(id, 'resolved');

    res.status(200).json({ message: 'Discussion marked as resolved' });
  } catch (error) {
    console.error('Mark resolved error:', error);
    res.status(500).json({ message: 'Failed to mark as resolved' });
  }
};