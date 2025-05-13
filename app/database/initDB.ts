import { queryWriter } from "./queryWriter"

const queries = [
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        username TEXT,
        password TEXT
        );`,
    `CREATE TABLE IF NOT EXISTS forms (
        id INTEGER PRIMARY KEY NOT NULL, 
        form_name TEXT, 
        organization INTEGER, 
        organization_name TEXT, 
        start_date TEXT, 
        end_date TEXT);`,
    `CREATE TABLE IF NOT EXISTS respondents (
        id INTEGER PRIMARY KEY NOT NULL, 
        id_no TEXT,
        fname TEXT,
        lname TEXT,
        dob TEXT,
        sex TEXT,
        ward TEXT,
        village TEXT,
        district TEXT,
        citizenship TEXT,
        email TEXT,
        contact_no TEXT,
        created_by TEXT
        );`,
    `CREATE TABLE IF NOT EXISTS response (
        id INTEGER PRIMARY KEY NOT NULL,
        respondent INTEGER,
        form INTEGER,
        created_on TEXT,
        FOREIGN KEY (respondent) REFERENCES respondents(id),
        FOREIGN KEY (form) REFERENCES forms(id)
    );`,
]

export default async function initDatabase(){
    try{
        for(const query of queries){
            await queryWriter(query, [])
        }
        console.log('Database initialized successfuly!')
    }
    catch(err){
        console.log('Database failed to initialize: ', err)
    }
}