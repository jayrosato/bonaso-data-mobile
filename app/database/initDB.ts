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

    `CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY NOT NULL,
        form INTEGER,
        question_index INTEGER,
        question TEXT,
        question_type TEXT,
        FOREIGN KEY (form) REFERENCES forms(id)
        );`,

    `CREATE TABLE IF NOT EXISTS options (
        id INTEGER PRIMARY KEY NOT NULL,
        option_id INTEGER,
        question INTEGER,
        option_text TEXT,
        special, TEXT,
        FOREIGN KEY (question) REFERENCES questions(id)
        );`,

    `CREATE TABLE IF NOT EXISTS logic (
        id INTEGER PRIMARY KEY NOT NULL,
        question INTEGER,
        conditional_operator TEXT,
        FOREIGN KEY (question) REFERENCES questions(id)
        );`,

    `CREATE TABLE IF NOT EXISTS logic_rules(
        id INTEGER PRIMARY KEY NOT NULL,
        logic INTEGER,
        parent_question INTEGER,
        expected_value TEXT,
        value_comparison TEXT,
        negate_value TEXT,
        limit_options TEXT,
        FOREIGN KEY (logic) REFERENCES logic(id),
        FOREIGN KEY(parent_question) REFERENCES questions(id)
        );`,

    `CREATE TABLE IF NOT EXISTS respondents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        linked_id INTEGER, 
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

    `CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        respondent INTEGER,
        form INTEGER,
        created_on TEXT,
        created_by INTEGER,
        is_synced INTEGER DEFAULT 0,
        FOREIGN KEY (respondent) REFERENCES respondents(id),
        FOREIGN KEY (form) REFERENCES forms(id)
    );`,

    `CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        response INTEGER,
        question INTEGER,
        option INTEGER, 
        open_answer TEXT,
        FOREIGN KEY (response) REFERENCES responses(id),
        FOREIGN KEY (question) REFERENCES questions(id),
        FOREIGN KEY (option) REFERENCES options(id)
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