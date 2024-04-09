const sinon = require('sinon');
const mysql = require('mysql');


console.log( process.env.DB_HOST);
console.log( process.env.DB_USER);
console.log( process.env.DB_PASSWORD);
console.log( process.env.DB_PORT_1);
console.log( process.env.DB_PORT_2);
console.log( process.env.DB_PORT_3);

const node1 = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT_1,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

const node2 = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT_2,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});
const node3 = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT_3,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

async function connect(connection) {
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                console.log('Error connecting to MySQL:', err.message);
                reject(err);
            } else {
                console.log('Connected to MySQL');
                resolve();
            }
        });
    });
}


async function query(connection, sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

async function end(connection) {
    return new Promise((resolve, reject) => {
        connection.end((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
// Establish all database connections before running test cases

  
describe('Test case 1:', () => {
    // Arrange
    it('Concurrent transactions in two or more nodes are reading the same data item', async() => {
        await Promise.all([connect(node1), connect(node2), connect(node3)]);
        const sql = "SELECT * FROM global_records LIMIT 1;";

        try {
            const [readResult1, readResult2] = await Promise.all([
                query(node1, sql),
                query(node2, sql)
            ]);
            console.log("node 1 = ", readResult1);
            console.log("node 2 = ", readResult2);
            
            // Assert
            expect(readResult1).toEqual(readResult2);
        } catch (error) {
            console.log('Error:', error);
        }
    });
});

describe('Test case 2: ', ()=>{
    it('At least one transaction in the three nodes is writing (update / delete) and the other concurrent transactions are reading the same data item.', async() => {
        const sql_read = "SELECT * FROM global_records WHERE pxid = 'FE4A5D5A20EC492D2FC691F126A568AB' LIMIT 1;";
        const sql_write = "UPDATE global_records SET isVirtual = 1 WHERE pxid = 'FE4A5D5A20EC492D2FC691F126A568AB';";       
        const expectedRow = [{
            pxid: 'FE4A5D5A20EC492D2FC691F126A568AB',
            apptid: '04BC9218E072BEEFEBEE9C97B78A35C9',
            status: 'Queued',
            TimeQueued: null,
            QueueDate: new Date('2020-07-02T08:00:00.000Z'),
            StartTime: null,
            EndTime: null,
            type: 'Consultation',
            isVirtual: 1,
            hospitalname: 'The Medical City',
            IsHospital: 1,
            City: 'Pasig',
            Province: 'Manila',
            RegionName: 'National Capital Region (NCR)',
            mainspecialty: 'Infectious Diseases',
            age_x: 24,
            age_y: 34,
            gender: 'FEMALE',
            islands: 'Luzon'
        }];
        try {
            const [writeResult, readResult] = await Promise.all([
                query(node1, sql_write),
                query(node2, sql_read)
            ]);
            console.log("node 2 = ", readResult);
            
            // Assert
            expect(readResult).toEqual(expectedRow);
        } catch (error) {
            console.log('Error:', error);
        } finally {
            await end(node1);
            await end(node2);
            await end(node3);
        }
    })
});





