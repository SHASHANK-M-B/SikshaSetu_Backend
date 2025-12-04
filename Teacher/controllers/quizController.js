const quizModel = require('../models/quizModel');
const courseModel = require('../models/courseModel');

exports.createQuiz = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { quizTitle, courseId, timeLimit, questions } = req.body;

    if (!quizTitle || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Quiz title and questions are required' });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.options || q.options.length < 2) {
        return res.status(400).json({ 
          message: `Question ${i + 1}: Must have question text and at least 2 options` 
        });
      }
      if (q.correctOption === undefined || q.correctOption === null) {
        return res.status(400).json({ 
          message: `Question ${i + 1}: Must specify correct option` 
        });
      }
      if (q.correctOption < 0 || q.correctOption >= q.options.length) {
        return res.status(400).json({ 
          message: `Question ${i + 1}: Correct option index out of range` 
        });
      }
    }

    if (courseId) {
      const course = await courseModel.getCourseById(courseId);
      if (!course || course.teacherId !== teacherId) {
        return res.status(400).json({ message: 'Invalid course' });
      }
    }

    const quiz = await quizModel.createQuiz({
      teacherId,
      quizTitle,
      courseId,
      timeLimit: timeLimit || 30,
      questions
    });

    res.status(201).json({
      message: 'Quiz created successfully',
      quizId: quiz.quizId
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const quizzes = await quizModel.getQuizzesByTeacherId(teacherId);

    const quizzesWithCourseInfo = await Promise.all(
      quizzes.map(async (quiz) => {
        let courseInfo = null;
        if (quiz.courseId) {
          const course = await courseModel.getCourseById(quiz.courseId);
          if (course) {
            courseInfo = {
              courseCode: course.courseCode,
              courseName: course.courseName
            };
          }
        }
        return {
          quizId: quiz.quizId,
          quizTitle: quiz.quizTitle,
          courseId: quiz.courseId,
          course: courseInfo,
          timeLimit: quiz.timeLimit,
          questionsCount: quiz.questions ? quiz.questions.length : 0,
          createdAt: quiz.createdAt
        };
      })
    );

    res.status(200).json({ quizzes: quizzesWithCourseInfo });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let courseInfo = null;
    if (quiz.courseId) {
      const course = await courseModel.getCourseById(quiz.courseId);
      if (course) {
        courseInfo = {
          courseCode: course.courseCode,
          courseName: course.courseName
        };
      }
    }

    res.status(200).json({
      quiz: {
        ...quiz,
        course: courseInfo
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;
    const { quizTitle, courseId, timeLimit, questions } = req.body;

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (questions) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || !q.options || q.options.length < 2) {
          return res.status(400).json({ 
            message: `Question ${i + 1}: Must have question text and at least 2 options` 
          });
        }
        if (q.correctOption === undefined || q.correctOption === null) {
          return res.status(400).json({ 
            message: `Question ${i + 1}: Must specify correct option` 
          });
        }
        if (q.correctOption < 0 || q.correctOption >= q.options.length) {
          return res.status(400).json({ 
            message: `Question ${i + 1}: Correct option index out of range` 
          });
        }
      }
    }

    if (courseId) {
      const course = await courseModel.getCourseById(courseId);
      if (!course || course.teacherId !== teacherId) {
        return res.status(400).json({ message: 'Invalid course' });
      }
    }

    const updateData = {};
    if (quizTitle) updateData.quizTitle = quizTitle;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (timeLimit) updateData.timeLimit = timeLimit;
    if (questions) updateData.questions = questions;

    await quizModel.updateQuiz(id, updateData);

    res.status(200).json({ message: 'Quiz updated successfully' });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Failed to update quiz' });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await quizModel.deleteQuiz(id);

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
};

exports.getQuizResponses = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const responses = await quizModel.getQuizResponsesByQuizId(id);

    const responseSummary = responses.map(response => ({
      responseId: response.responseId,
      studentId: response.studentId,
      studentName: response.studentName,
      score: response.score,
      totalQuestions: response.totalQuestions,
      correctAnswers: response.correctAnswers,
      percentage: ((response.correctAnswers / response.totalQuestions) * 100).toFixed(2),
      submittedAt: response.submittedAt
    }));

    res.status(200).json({
      quizTitle: quiz.quizTitle,
      totalResponses: responses.length,
      responses: responseSummary
    });
  } catch (error) {
    console.error('Get quiz responses error:', error);
    res.status(500).json({ message: 'Failed to fetch quiz responses' });
  }
};

exports.getQuizResponseDetail = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id, responseId } = req.params;

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const responses = await quizModel.getQuizResponsesByQuizId(id);
    const response = responses.find(r => r.responseId === responseId);

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    res.status(200).json({ response });
  } catch (error) {
    console.error('Get quiz response detail error:', error);
    res.status(500).json({ message: 'Failed to fetch response detail' });
  }
};