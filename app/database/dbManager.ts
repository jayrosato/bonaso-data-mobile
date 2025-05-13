import * as SQLite from 'expo-sqlite';

let db:any;

const openDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('forms.db');
    }
    return db;
};

export default openDB;