document.addEventListener("DOMContentLoaded", function () {
    // ========== Global Variables ==========
    const newTaskInput = document.getElementById("newTaskInput");
    const prioritySelect = document.getElementById("prioritySelect");
    const categorySelect = document.getElementById("categorySelect");
    const addTaskButton = document.getElementById("addTaskButton");
    const taskList = document.getElementById("taskList");
    const undoButton = document.getElementById("undoButton");

    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const saveDrawingButton = document.getElementById("saveDrawingButton");
    const clearCanvasButton = document.getElementById("clearCanvasButton");

    const themeToggle = document.getElementById("themeToggle");
    const categoryNameInput = document.getElementById("categoryNameInput");
    const categoryColorInput = document.getElementById("categoryColorInput");
    const addCategoryButton = document.getElementById("addCategoryButton");

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let categories = JSON.parse(localStorage.getItem("categories")) || {};
    let deletedTasks = [];
    let drawing = false;
    let draggedTaskId = null;

    // ========== Load & Save Data ==========
    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function saveCategories() {
        localStorage.setItem("categories", JSON.stringify(categories));
    }

    function loadTasks() {
        renderTasks();
        updateCategoryDropdowns();
    }

    // ========== Add Custom Category ==========
    function addCategory() {
        const categoryName = categoryNameInput.value.trim();
        const categoryColor = categoryColorInput.value;

        if (!categoryName || categories[categoryName]) return;

        categories[categoryName] = categoryColor;
        saveCategories();
        updateCategoryDropdowns();

        categoryNameInput.value = "";
    }

    function updateCategoryDropdowns() {
        categorySelect.innerHTML = '<option value="">No Category</option>';
        for (let name in categories) {
            categorySelect.innerHTML += `<option value="${name}">${name}</option>`;
        }
    }

    function addTask() {
        const taskText = newTaskInput.value.trim();
        const priority = prioritySelect.value || "low";
        const category = categorySelect.value || "No Category";

        if (!taskText) return;

        tasks.push({ id: Date.now(), text: taskText, priority, category, completed: false, type: "text" });
        saveTasks();
        renderTasks();
        newTaskInput.value = "";
    }

    // ========== Canvas Drawing Fix ==========
    if (canvas && ctx) {
        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("mouseleave", stopDrawing);
        canvas.addEventListener("mousemove", draw);
    }

    function startDrawing(event) {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(event.offsetX, event.offsetY);
    }

    function draw(event) {
        if (!drawing) return;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";

        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
    }

    function stopDrawing() {
        drawing = false;
        ctx.beginPath();
    }

    function saveDrawingTask() {
        if (!canvas || !ctx) return;

        const imageData = canvas.toDataURL();
        const priority = prioritySelect.value || "low";
        const category = categorySelect.value || "No Category";

        tasks.push({ id: Date.now(), image: imageData, priority, category, completed: false, type: "drawing" });
        saveTasks();
        renderTasks();
        clearCanvas();
    }

    function clearCanvas() {
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function renderTasks() {
        taskList.innerHTML = "";

        tasks.forEach(task => {
            const taskItem = document.createElement("li");
            taskItem.className = `task ${task.completed ? "completed" : ""}`;
            taskItem.draggable = true;
            taskItem.dataset.id = task.id;

            taskItem.innerHTML = `
                <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleTaskCompletion(${task.id})" />
                <span class="priority ${task.priority}">${task.priority.toUpperCase()}</span>
                ${task.category !== "No Category" ? `<span class="category" style="background:${categories[task.category] || '#ccc'}">${task.category}</span>` : ""}
                ${task.image ? `<img src="${task.image}" width="100" height="50">` : `<span>${task.text}</span>`}
            `;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.classList.add("deleteButton");
            deleteButton.addEventListener("click", () => deleteTask(task.id));

            taskItem.appendChild(deleteButton);
            taskItem.addEventListener("dragstart", handleDragStart);
            taskItem.addEventListener("dragover", handleDragOver);
            taskItem.addEventListener("drop", handleDrop);

            taskList.appendChild(taskItem);
        });
    }

    function handleDragStart(e) {
        draggedTaskId = e.target.dataset.id;
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        const targetId = e.target.closest(".task").dataset.id;
        const draggedIndex = tasks.findIndex(task => task.id == draggedTaskId);
        const targetIndex = tasks.findIndex(task => task.id == targetId);

        if (draggedIndex > -1 && targetIndex > -1) {
            const [draggedTask] = tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, draggedTask);
            saveTasks();
            renderTasks();
        }
    }

    function toggleTaskCompletion(taskId) {
        tasks = tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    function deleteTask(taskId) {
        const taskToDelete = tasks.find(task => task.id === taskId);
        if (taskToDelete) {
            deletedTasks.push(taskToDelete);
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            updateUndoButton();
        }
    }

    function undoLastDelete() {
        if (deletedTasks.length > 0) {
            const restoredTask = deletedTasks.pop();
            tasks.push(restoredTask);
            saveTasks();
            renderTasks();
        }
        updateUndoButton();
    }

    function updateUndoButton() {
        undoButton.disabled = deletedTasks.length === 0;
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
            themeToggle.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
        });

        function loadTheme() {
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme === "dark") {
                document.body.classList.add("dark-mode");
                themeToggle.textContent = "Light Mode";
            }
        }
        loadTheme();
    }

    addTaskButton.addEventListener("click", addTask);
    addCategoryButton.addEventListener("click", addCategory);
    undoButton.addEventListener("click", undoLastDelete);
    saveDrawingButton.addEventListener("click", saveDrawingTask);
    clearCanvasButton.addEventListener("click", clearCanvas);

    loadTasks();
});
