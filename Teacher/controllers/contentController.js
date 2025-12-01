const contentModel = require('../models/contentModel');
const teacherModel = require('../models/teacherModel');
const courseModel = require('../models/courseModel');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const fileUpload = require('../utils/fileUpload');

exports.uploadContent = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { title, description, courseId, slideAudioMapping } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    if (!req.files || !req.files.slides || !req.files.audio) {
      return res.status(400).json({ message: 'Slides and audio files are required' });
    }

    if (req.files.slides.length === 0) {
      return res.status(400).json({ message: 'At least one slide is required' });
    }

    if (req.files.audio.length !== 1) {
      return res.status(400).json({ message: 'Exactly one audio file is required' });
    }

    const teacher = await teacherModel.getTeacherById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (courseId) {
      const course = await courseModel.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (course.teacherId !== teacherId) {
        return res.status(403).json({ message: 'Access denied to this course' });
      }
    }

    const processedSlides = await uploadMiddleware.processMultipleFiles(req.files.slides, 'slide');
    const processedAudio = await uploadMiddleware.processFile(req.files.audio[0], 'audio');

    const uploadedSlides = await fileUpload.uploadMultipleToStorage(processedSlides, 'recorded_lectures/slides');
    const uploadedAudio = await fileUpload.uploadToStorage(
      processedAudio.buffer,
      processedAudio.filename,
      processedAudio.mimetype,
      'recorded_lectures/audio'
    );

    const mapping = slideAudioMapping ? JSON.parse(slideAudioMapping) : {};

    const content = await contentModel.createContent({
      teacherId,
      orgId: teacher.orgId,
      courseId: courseId || null,
      title,
      description,
      slides: uploadedSlides.map((slide, index) => ({
        url: slide.url,
        filePath: slide.filePath,
        filename: slide.filename,
        size: slide.size,
        index
      })),
      audio: {
        url: uploadedAudio.url,
        filePath: uploadedAudio.filePath,
        filename: uploadedAudio.filename,
        size: uploadedAudio.size
      },
      slideAudioMapping: mapping
    });

    res.status(201).json({
      message: 'Recorded lecture uploaded successfully',
      contentId: content.contentId,
      content
    });
  } catch (error) {
    console.error('Content upload error:', error);
    res.status(500).json({ message: 'Failed to upload recorded lecture' });
  }
};

exports.getContents = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const contents = await contentModel.getContentsByTeacherId(teacherId);

    res.status(200).json({ contents });
  } catch (error) {
    console.error('Contents fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch recorded lectures' });
  }
};

exports.getContent = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const content = await contentModel.getContentById(id);
    if (!content) {
      return res.status(404).json({ message: 'Recorded lecture not found' });
    }

    if (content.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch recorded lecture' });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;
    const { title, description, courseId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const content = await contentModel.getContentById(id);
    if (!content) {
      return res.status(404).json({ message: 'Recorded lecture not found' });
    }

    if (content.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (courseId) {
      const course = await courseModel.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (course.teacherId !== teacherId) {
        return res.status(403).json({ message: 'Access denied to this course' });
      }
    }

    await contentModel.updateContent(id, {
      title,
      description,
      courseId: courseId || null
    });

    res.status(200).json({ message: 'Recorded lecture updated successfully' });
  } catch (error) {
    console.error('Content update error:', error);
    res.status(500).json({ message: 'Failed to update recorded lecture' });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const content = await contentModel.getContentById(id);
    if (!content) {
      return res.status(404).json({ message: 'Recorded lecture not found' });
    }

    if (content.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filePaths = [
      content.audio.filePath,
      ...content.slides.map(slide => slide.filePath)
    ];

    await fileUpload.deleteMultipleFromStorage(filePaths);
    await contentModel.deleteContent(id);

    res.status(200).json({ message: 'Recorded lecture deleted successfully' });
  } catch (error) {
    console.error('Content deletion error:', error);
    res.status(500).json({ message: 'Failed to delete recorded lecture' });
  }
};