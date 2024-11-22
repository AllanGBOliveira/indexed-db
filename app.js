/**
 * TaskManager class
 * This class handles all IndexedDB operations and UI interactions for the Task Manager application.
 */
class TaskManager {
    constructor() {
        // Initialize database properties
        this.dbName = 'TaskManagerDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDB();
        this.bindEvents();
    }

    /**
     * Initialize the IndexedDB database
     * IndexedDB is a low-level API for client-side storage of structured data.
     * It lets you store and retrieve objects that are indexed with a key.
     */
    initDB() {
        // Open a connection to the IndexedDB database
        // If the database doesn't exist, it will be created
        const request = indexedDB.open(this.dbName, this.dbVersion);

        // Error handler for database opening
        request.onerror = (event) => {
            console.error('Error opening database:', event.target.error);
        };

        // Success handler for database opening
        request.onsuccess = (event) => {
            // Store the database connection for later use
            this.db = event.target.result;
            console.log('Database opened successfully');
            this.displayTasks();
        };

        // This event is only triggered when the database is opened for the first time
        // or when the database version changes
        request.onupgradeneeded = (event) => {
            this.db = event.target.result;

            // Create an object store (similar to a table in relational databases)
            // The keyPath is the property that IndexedDB will use as the key for each object
            const objectStore = this.db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });

            // Create indexes for faster querying
            // Indexes are optional but can improve performance for specific queries
            objectStore.createIndex('title', 'title', { unique: false });
            objectStore.createIndex('description', 'description', { unique: false });

            console.log('Object store and indexes created');
        };
    }

    // Bind event listeners
    bindEvents() {
        document.getElementById('task-form').addEventListener('submit', (e) => this.addTask(e));
    }

    /**
     * Add a new task to the IndexedDB database
     * This method demonstrates how to perform a 'Create' operation in IndexedDB
     */
    addTask(e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const task = { title, description };

        // Start a transaction and get the object store
        // Transactions ensure database integrity and provide atomicity
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');

        // Add the task object to the object store
        const request = objectStore.add(task);

        request.onerror = (event) => {
            console.error('Error adding task:', event.target.error);
        };

        request.onsuccess = () => {
            console.log('Task added successfully');
            document.getElementById('task-form').reset();
            this.displayTasks();
        };
    }

    /**
     * Display all tasks from the IndexedDB database
     * This method demonstrates how to perform a 'Read' operation in IndexedDB
     */
    displayTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        // Open a cursor to iterate through all objects in the store
        const objectStore = this.db.transaction('tasks').objectStore('tasks');
        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const task = cursor.value;
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.innerHTML = `
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <button class="edit-btn" data-id="${task.id}">Edit</button>
                    <button class="delete-btn" data-id="${task.id}">Delete</button>
                `;
                taskList.appendChild(taskItem);

                // Add event listeners for edit and delete buttons
                taskItem.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task.id));
                taskItem.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

                // Move to the next object in the store
                cursor.continue();
            }
        };
    }

    /**
     * Edit an existing task in the IndexedDB database
     * This method demonstrates how to perform an 'Update' operation in IndexedDB
     */
    editTask(id) {
        // Start a transaction and get the object store
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');

        // Retrieve the task from the database
        const request = objectStore.get(id);

        request.onerror = (event) => {
            console.error('Error retrieving task:', event.target.error);
        };

        request.onsuccess = (event) => {
            const task = event.target.result;
            const newTitle = prompt('Enter new title:', task.title);
            const newDescription = prompt('Enter new description:', task.description);

            if (newTitle && newDescription) {
                // Update the task object
                task.title = newTitle;
                task.description = newDescription;

                // Put the updated object back into the database
                const updateRequest = objectStore.put(task);

                updateRequest.onerror = (event) => {
                    console.error('Error updating task:', event.target.error);
                };

                updateRequest.onsuccess = () => {
                    console.log('Task updated successfully');
                    this.displayTasks();
                };
            }
        };
    }

    /**
     * Delete a task from the IndexedDB database
     * This method demonstrates how to perform a 'Delete' operation in IndexedDB
     */
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            // Start a transaction and get the object store
            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const objectStore = transaction.objectStore('tasks');

            // Delete the task from the database
            const request = objectStore.delete(id);

            request.onerror = (event) => {
                console.error('Error deleting task:', event.target.error);
            };

            request.onsuccess = () => {
                console.log('Task deleted successfully');
                this.displayTasks();
            };
        }
    }
}

// Initialize the TaskManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

/**
 * Additional IndexedDB Concepts:
 * 
 * 1. Database Versioning:
 *    IndexedDB uses version numbers to manage schema changes. When you need to modify
 *    the database structure (e.g., adding or removing object stores or indexes),
 *    you increment the version number and handle the changes in the onupgradeneeded event.
 * 
 * 2. Object Stores:
 *    Similar to tables in relational databases, object stores hold the data in IndexedDB.
 *    Each object store can contain JavaScript objects, arrays, and even files.
 * 
 * 3. Indexes:
 *    Indexes improve query performance by allowing you to look up records in an object store
 *    using properties other than the primary key.
 * 
 * 4. Cursors:
 *    Cursors allow you to iterate over multiple objects in a database or an index.
 *    They are useful for traversing large datasets efficiently.
 * 
 * 5. Key Ranges:
 *    Key ranges let you select a range of keys to retrieve from an object store or index.
 *    This is useful for implementing pagination or filtering.
 * 
 * 6. Transactions:
 *    Transactions group operations together and ensure that all operations either complete
 *    successfully or fail without applying any changes. This helps maintain data integrity.
 * 
 * 7. Asynchronous Nature:
 *    All IndexedDB operations are asynchronous, which means they don't block the main thread.
 *    This is why we use callbacks or promises to handle the results of these operations.
 */

