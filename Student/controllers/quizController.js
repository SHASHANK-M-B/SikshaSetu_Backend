const quizModel = require('../../Teacher/models/quizModel');
const courseModel = require('../../Teacher/models/courseModel');

exports.getAvailableQuizzes = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const quizzes = await quizModel.getAllQuizzes();

    const quizzesWithDetails = await Promise.all(
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

        const existingResponse = await quizModel.getStudentQuizResponse(quiz.quizId, studentId);
        const hasAttempted = !!existingResponse;

        return {
          quizId: quiz.quizId,
          quizTitle: quiz.quizTitle,
          courseId: quiz.courseId,
          course: courseInfo,
          timeLimit: quiz.timeLimit,
          questionsCount: quiz.questions ? quiz.questions.length : 0,
          hasAttempted,
          createdAt: quiz.createdAt
        };
      })
    );

    res.status(200).json({ quizzes: quizzesWithDetails });
  } catch (error) {
    console.error('Get available quizzes error:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};

exports.getQuizForStudent = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const existingResponse = await quizModel.getStudentQuizResponse(id, studentId);
    if (existingResponse) {
      return res.status(400).json({ 
        message: 'You have already attempted this quiz',
        response: {
          score: existingResponse.score,
          totalQuestions: existingResponse.totalQuestions,
          correctAnswers: existingResponse.correctAnswers,
          percentage: ((existingResponse.correctAnswers / existingResponse.totalQuestions) * 100).toFixed(2)
        }
      });
    }

    const questionsWithoutAnswers = quiz.questions.map((q, index) => ({
      questionNumber: index + 1,
      questionText: q.questionText,
      options: q.options
    }));

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
      quizId: quiz.quizId,
      quizTitle: quiz.quizTitle,
      course: courseInfo,
      timeLimit: quiz.timeLimit,
      totalQuestions: quiz.questions.length,
      questions: questionsWithoutAnswers
    });
  } catch (error) {
    console.error('Get quiz for student error:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required' });
    }

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const existingResponse = await quizModel.getStudentQuizResponse(id, studentId);
    if (existingResponse) {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({ 
        message: `Expected ${quiz.questions.length} answers, got ${answers.length}` 
      });
    }

    let correctAnswers = 0;
    const evaluatedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const isCorrect = answer === question.correctOption;
      if (isCorrect) correctAnswers++;

      return {
        questionNumber: index + 1,
        selectedOption: answer,
        correctOption: question.correctOption,
        isCorrect
      };
    });

    const student = await require('../models/studentModel').getStudentById(studentId);
    const studentName = student ? student.studentName : 'Unknown Student';

    const response = await quizModel.createQuizResponse({
      quizId: id,
      studentId,
      studentName,
      answers: evaluatedAnswers,
      score: correctAnswers,
      totalQuestions: quiz.questions.length,
      correctAnswers
    });

    res.status(201).json({
      message: 'Quiz submitted successfully',
      responseId: response.responseId,
      score: correctAnswers,
      totalQuestions: quiz.questions.length,
      percentage: ((correctAnswers / quiz.questions.length) * 100).toFixed(2),
      answers: evaluatedAnswers
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
};

exports.getMyQuizResponses = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const responses = await quizModel.getQuizResponsesByStudentId(studentId);

    const responsesWithQuizInfo = await Promise.all(
      responses.map(async (response) => {
        const quiz = await quizModel.getQuizById(response.quizId);
        
        return {
          responseId: response.responseId,
          quizId: response.quizId,
          quizTitle: quiz ? quiz.quizTitle : 'Unknown Quiz',
          score: response.score,
          totalQuestions: response.totalQuestions,
          correctAnswers: response.correctAnswers,
          percentage: ((response.correctAnswers / response.totalQuestions) * 100).toFixed(2),
          submittedAt: response.submittedAt
        };
      })
    );

    res.status(200).json({ responses: responsesWithQuizInfo });
  } catch (error) {
    console.error('Get my quiz responses error:', error);
    res.status(500).json({ message: 'Failed to fetch quiz responses' });
  }
};

exports.getMyQuizResponseDetail = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id } = req.params;

    const quiz = await quizModel.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const response = await quizModel.getStudentQuizResponse(id, studentId);
    if (!response) {
      return res.status(404).json({ message: 'No response found for this quiz' });
    }

    const detailedAnswers = response.answers.map((answer, index) => {
      const question = quiz.questions[index];
      return {
        questionNumber: answer.questionNumber,
        questionText: question.questionText,
        options: question.options,
        selectedOption: answer.selectedOption,
        correctOption: answer.correctOption,
        isCorrect: answer.isCorrect
      };
    });

    res.status(200).json({
      quizTitle: quiz.quizTitle,
      score: response.score,
      totalQuestions: response.totalQuestions,
      correctAnswers: response.correctAnswers,
      percentage: ((response.correctAnswers / response.totalQuestions) * 100).toFixed(2),
      submittedAt: response.submittedAt,
      answers: detailedAnswers
    });
  } catch (error) {
    console.error('Get my quiz response detail error:', error);
    res.status(500).json({ message: 'Failed to fetch response detail' });
  }
};