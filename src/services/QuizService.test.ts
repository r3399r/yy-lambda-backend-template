import { bindings } from 'src/bindings';
import {
  DbQuiz,
  QuestionType,
  QuizStatus,
  QuizValidateResponse,
  QuizValidateResponseStatus,
} from 'src/model/altarf/Quiz';
import { DbTeacherStudentPair, Role } from 'src/model/altarf/User';
import { AltarfEntity } from 'src/model/DbKey';
import { DbUser } from 'src/model/User';
import { Validator } from 'src/Validator';
import { DbService } from './DbService';
import { GoogleSheetService } from './GoogleSheetService';
import { QuizService } from './QuizService';
import { AltarfUserService } from './users/AltarfUserService';

/**
 * Tests of the QuizService class.
 */
describe('QuizService', () => {
  let quizService: QuizService;
  let mockGooglesheetService: any;
  let mockAltarfUserService: any;
  let mockDbService: any;
  let mockValidator: any;
  let dummyGoodQuestionRow: unknown[];
  let dummyGoodResult: QuizValidateResponse;
  let dummyBadQuestionRow: unknown[];
  let dummyBadResult: QuizValidateResponse;
  let dummyDbTeacher: DbUser;
  let dummyDbStudent: DbUser;
  let dummyDbTeacherStudentPair: DbTeacherStudentPair;
  let dummyDbQuiz: DbQuiz;

  beforeAll(() => {
    dummyDbQuiz = {
      projectEntity: AltarfEntity.quiz,
      creationId: 'quiz',
      owner: 'me',
      label: 'aaa',
      questions: [],
    };
    dummyDbTeacherStudentPair = {
      projectEntity: AltarfEntity.teacherStudentPair,
      creationId: 'id',
      teacherId: 'teacher',
      studentId: 'student',
      quizes: [{ quizId: 'old', status: QuizStatus.TODO, time: 10 }],
    };
    dummyGoodQuestionRow = [
      {
        question: 'a',
        type: QuestionType.SINGLE,
        options: '1',
        answer: '1',
        field: 'N',
      },
    ];
    dummyBadQuestionRow = [
      {
        question: 'a',
        type: QuestionType.SINGLE,
        options: '1',
        answer: '1',
        field: 'N',
      },
      {},
      {
        question: 'b',
        type: 'wrong',
        options: 'text',
        answer: 'text',
        field: 'N',
      },
      {
        question: 'c',
        type: QuestionType.SINGLE,
        options: '-1',
        answer: '-1,2',
        field: 'N',
      },
    ];
    dummyGoodResult = {
      status: QuizValidateResponseStatus.OK,
      content: [],
    };
    dummyBadResult = {
      status: QuizValidateResponseStatus.NEED_MORE_WORK,
      content: [],
    };
    dummyDbTeacher = {
      projectEntity: AltarfEntity.user,
      creationId: 'teacherId',
      lineUserId: 'lineId',
      name: 'tester',
      role: Role.TEACHER,
      spreadsheetId: '12345',
      classroom: 'cccc',
    };
    dummyDbStudent = {
      projectEntity: AltarfEntity.user,
      creationId: 'studentId',
      lineUserId: 'lineId',
      name: 'student',
      role: Role.STUDENT,
    };
  });

  beforeEach(() => {
    mockGooglesheetService = { getRows: jest.fn(() => dummyGoodQuestionRow) };
    mockAltarfUserService = {
      getUserByLineId: jest.fn(() => dummyDbTeacher),
      getUserById: jest.fn(() => dummyDbStudent),
    };
    mockDbService = {
      putItem: jest.fn(),
      getItem: jest.fn(() => dummyDbQuiz),
      query: jest.fn(() => [dummyDbTeacherStudentPair]),
    };
    mockValidator = {
      validateAssignQuizParams: jest.fn(),
      validateSaveQuizParams: jest.fn(),
    };

    bindings
      .rebind<GoogleSheetService>(GoogleSheetService)
      .toConstantValue(mockGooglesheetService);
    bindings
      .rebind<AltarfUserService>(AltarfUserService)
      .toConstantValue(mockAltarfUserService);
    bindings.rebind<DbService>(DbService).toConstantValue(mockDbService);
    bindings.rebind<Validator>(Validator).toConstantValue(mockValidator);

    quizService = bindings.get<QuizService>(QuizService);
  });

  it('save should return OK', async () => {
    const res = await quizService.save('lineId', 'sheetId', { label: 'b' });
    expect(res.status).toBe(dummyGoodResult.status);
  });

  it('save should return NEED_MORE_WORK', async () => {
    mockGooglesheetService.getRows = jest.fn(() => dummyBadQuestionRow);
    const res = await quizService.save('lineId', 'sheetId', { label: 'a' });
    expect(res.status).toBe(dummyBadResult.status);
  });

  it('assign should work', async () => {
    await quizService.assign('lineId', {
      studentId: ['student'],
      quizId: [dummyDbQuiz.creationId],
      time: 12,
    });
    expect(mockDbService.putItem).toHaveBeenCalledTimes(1);
  });
});
