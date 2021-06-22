import 'mocha';
import { assert } from 'chai';
import Database from '../../src/backend/scripts/karopapier/database/database';
import Utils from '../../src/backend/scripts/utility/utils';

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
    }
);
