const discussionModel = require('../models/discussionModel');
const courseModel = require('../models/courseModel');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { bucket } = require('../../config/Firebase');

exports.getDiscussions = async (req, res) => {
  try {
    const teacherId = req.user.userId;
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
    console.error('Get discussions error:', error);
    res.status(500).json({ message: 'Failed to fetch discussions' });
  }
};

exports.getDiscussionThread = async (req, res) => {
  try {
    const teacherId = req.user.userId;
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
    const teacherId = req.user.userId;
    const { id } = req.params;
    const { messageText } = req.body;

    if (!messageText) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const discussion = await discussionModel.getDiscussionById(id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const teacher = await require('../models/teacherModel').getTeacherById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
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
      userId: teacherId,
      userName: teacher.name,
      role: 'teacher',
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

exports.updateDiscussionStatus = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['resolved', 'unresolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "resolved" or "unresolved"' });
    }

    const discussion = await discussionModel.getDiscussionById(id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    await discussionModel.updateDiscussionStatus(id, status);

    res.status(200).json({ message: 'Discussion status updated' });
  } catch (error) {
    console.error('Update discussion status error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
};