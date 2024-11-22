class TaskManager {
    constructor() {
        this.dbName = 'TaskManagerDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDB();
        this.bindEvents();
    }

    initDB() {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = (event) => {
            console.error('Error opening database:', event.target.error);
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('Database opened successfully');
            this.displayTasks();
        };

        request.onupgradeneeded = (event) => {
            this.db = event.target.result;
            const objectStore = this.db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('title', 'title', { unique: false });
            objectStore.createIndex('description', 'description', { unique: false });
            console.log('Object store created');
        };
    }

    bindEvents() {
        document.getElementById('task-form').addEventListener('submit', (e) => this.addTask(e));
    }

    addTask(e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const task = { title, description };

        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');
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

    displayTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

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

                taskItem.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task.id));
                taskItem.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

                cursor.continue();
            }
        };
    }

    editTask(id) {
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');
        const request = objectStore.get(id);

        request.onerror = (event) => {
            console.error('Error retrieving task:', event.target.error);
        };

        request.onsuccess = (event) => {
            const task = event.target.result;
            const newTitle = prompt('Enter new title:', task.title);
            const newDescription = prompt('Enter new description:', task.description);

            if (newTitle && newDescription) {
                task.title = newTitle;
                task.description = newDescription;

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

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const objectStore = transaction.objectStore('tasks');
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

