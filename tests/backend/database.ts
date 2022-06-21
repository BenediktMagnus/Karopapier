import 'mocha';
import { assert } from 'chai';
import Database from '../../src/backend/karopapier/database/database';
import Utils from '../../src/shared/utils';

const testUserInsert = {
    name: 'testName',
    passwordHash: 'testHash',
    isAdmin: true,
};

describe('database',
    function ()
    {
        let database: Database;

        beforeEach(
            function ()
            {
                // In-memory database for testing:
                database = new Database('test', true);
            }
        );

        afterEach(
            function ()
            {
                database.close();
            }
        );

        it('can insert a user.',
            function ()
            {
                const user = database.insertUser(testUserInsert);

                assert.notStrictEqual(user.id, 0);
                assert.strictEqual(user.name, testUserInsert.name);
                assert.strictEqual(user.passwordHash, testUserInsert.passwordHash);
                assert.strictEqual(user.isAdmin, testUserInsert.isAdmin);
            }
        );

        it('can get a user.',
            function ()
            {
                const insertedUser = database.insertUser(testUserInsert);

                const gotUser = database.getUser(insertedUser.id);

                assert.deepStrictEqual(gotUser, insertedUser);
            }
        );

        it('can get a user by name.',
            function ()
            {
                const insertedUser = database.insertUser(testUserInsert);

                const gotUser = database.getUserByName(insertedUser.name);

                assert.deepStrictEqual(gotUser, insertedUser);
            }
        );

        it('can insert a session.',
            function ()
            {
                const sessionInsert = {
                    userId: database.insertUser(testUserInsert).id,
                    token: 'testToken',
                };

                const session = database.insertSession(sessionInsert);

                assert.notStrictEqual(session.id, 0);
                assert.strictEqual(session.userId, sessionInsert.userId);
                assert.strictEqual(session.token, sessionInsert.token);
                assert.notStrictEqual(session.lastAccess, 0);
            }
        );

        it('can get a session.',
            function ()
            {
                const sessionInsert = {
                    userId: database.insertUser(testUserInsert).id,
                    token: 'testToken',
                };

                const insertedSession = database.insertSession(sessionInsert);

                const gotSession = database.getSession(insertedSession.id);

                assert.deepStrictEqual(gotSession, insertedSession);
            }
        );

        it('can update session access time.',
            function ()
            {
                const sessionInsert = {
                    userId: database.insertUser(testUserInsert).id,
                    token: 'testToken',
                };

                const insertedSession = database.insertSession(sessionInsert);

                // eslint-disable-next-line @typescript-eslint/unbound-method
                const originalUtilsGetCurrentUnixTime = Utils.getCurrentUnixTime;

                try
                {
                    // Mock the unix time to return something different from what has been set:
                    Utils.getCurrentUnixTime = (): number => { return insertedSession.lastAccess + 1; };

                    database.updateSessionAccessTime(insertedSession.id);
                }
                finally
                {
                    Utils.getCurrentUnixTime = originalUtilsGetCurrentUnixTime;
                }

                const updatedSession = database.getSession(insertedSession.id);

                assert.isDefined(updatedSession);

                if (updatedSession !== undefined)
                {
                    assert.notStrictEqual(updatedSession.lastAccess, insertedSession.lastAccess);
                }
            }
        );

        it('can delete a session.',
            function ()
            {
                const sessionInsert = {
                    userId: database.insertUser(testUserInsert).id,
                    token: 'testToken',
                };

                const insertedSession = database.insertSession(sessionInsert);

                database.deleteSession(insertedSession.id);

                const gotSession = database.getSession(insertedSession.id);

                assert.isUndefined(gotSession);
            }
        );
    }
);
