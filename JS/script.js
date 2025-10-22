/**
 * PLAN DE PASANTÍA IA - JAVASCRIPT PRINCIPAL
 * Sistema completo de productividad personal
 */

// ========================================
// GLOBAL STATE & STORAGE MANAGER
// ========================================

const AppState = {
    currentView: 'dashboard',
    currentTheme: localStorage.getItem('theme') || 'light',
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    notes: JSON.parse(localStorage.getItem('notes')) || [],
    habits: JSON.parse(localStorage.getItem('habits')) || [],
    events: JSON.parse(localStorage.getItem('events')) || [],
    resources: JSON.parse(localStorage.getItem('resources')) || [],
    goals: JSON.parse(localStorage.getItem('goals')) || [],
    pomodoroSessions: JSON.parse(localStorage.getItem('pomodoroSessions')) || [],
    calendarDate: new Date(),
    calendarView: 'month',
    pomodoroState: {
        isRunning: false,
        isPaused: false,
        timeLeft: 25 * 60, // 25 minutos en segundos
        totalTime: 25 * 60,
        sessionsCompleted: 0,
        isBreak: false
    }
};

// Save to localStorage
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// NAVIGATION & VIEW MANAGEMENT
// ========================================

function initNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const viewName = tab.dataset.view;
            switchView(viewName);
            
            // Update active tab
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            AppState.currentView = viewName;
        });
    });
}

function switchView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        
        // Refresh data for specific views
        if (viewName === 'dashboard') refreshDashboard();
        if (viewName === 'tasks') renderTasks();
        if (viewName === 'notes') renderNotes();
        if (viewName === 'habits') renderHabits();
        if (viewName === 'calendar') renderCalendar();
        if (viewName === 'roadmap') renderRoadmap();
        if (viewName === 'resources') renderResources();
        if (viewName === 'analytics') renderAnalytics();
    }
}

// ========================================
// THEME MANAGEMENT
// ========================================

function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Apply saved theme
    if (AppState.currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            AppState.currentTheme = 'dark';
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            AppState.currentTheme = 'light';
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        localStorage.setItem('theme', AppState.currentTheme);
        showToast(`Tema ${AppState.currentTheme === 'dark' ? 'oscuro' : 'claro'} activado`);
    });
}

// ========================================
// DASHBOARD
// ========================================

function refreshDashboard() {
    updateDashboardStats();
    renderTodayTasks();
    renderHabitsQuick();
    renderRecentNotes();
    renderGoals();
    renderWeeklyProgressChart();
}

function updateDashboardStats() {
    const today = new Date().toDateString();
    const activeTasks = AppState.tasks.filter(t => t.status !== 'completed').length;
    const completedToday = AppState.tasks.filter(t => 
        t.completedAt && new Date(t.completedAt).toDateString() === today
    ).length;
    
    // Calculate streak
    const streak = calculateHabitStreak();
    
    // Calculate focus time
    const focusTime = Math.floor((AppState.pomodoroSessions.length * 25) / 60);
    
    document.getElementById('statTotalTasks').textContent = activeTasks;
    document.getElementById('statCompletedToday').textContent = completedToday;
    document.getElementById('statStreak').textContent = streak;
    document.getElementById('statFocusTime').textContent = focusTime + 'h';
}

function calculateHabitStreak() {
    if (AppState.habits.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const anyCompleted = AppState.habits.some(habit => 
            habit.completedDates && habit.completedDates.includes(dateStr)
        );
        
        if (anyCompleted) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function renderTodayTasks() {
    const container = document.getElementById('todayTasksList');
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = AppState.tasks.filter(t => 
        t.dueDate === today && t.status !== 'completed'
    ).slice(0, 5);
    
    if (todayTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-check"></i>
                <p>No hay tareas para hoy</p>
                <button class="btn btn-small" onclick="document.querySelector('[data-view=tasks]').click()">Crear tarea</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = todayTasks.map(task => `
        <div class="task-item" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
            </div>
            <div class="task-meta">
                <span><i class="fas fa-clock"></i> Hoy</span>
            </div>
        </div>
    `).join('');
}

function renderHabitsQuick() {
    const container = document.getElementById('habitsQuickList');
    const today = new Date().toISOString().split('T')[0];
    
    if (AppState.habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heartbeat"></i>
                <p>No hay hábitos configurados</p>
                <button class="btn btn-small" onclick="document.querySelector('[data-view=habits]').click()">Crear hábito</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.habits.slice(0, 5).map(habit => {
        const isCompleted = habit.completedDates && habit.completedDates.includes(today);
        return `
            <div class="habit-item" style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-lg); margin-bottom: 0.5rem;">
                <button class="habit-check ${isCompleted ? 'completed' : ''}" 
                        style="width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid var(--primary); background: ${isCompleted ? 'var(--primary)' : 'transparent'}; color: white; cursor: pointer;"
                        onclick="toggleHabitToday('${habit.id}')">
                    ${isCompleted ? '<i class="fas fa-check"></i>' : ''}
                </button>
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${habit.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        Racha: ${calculateHabitStreakIndividual(habit)} días
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function calculateHabitStreakIndividual(habit) {
    if (!habit.completedDates || habit.completedDates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (habit.completedDates.includes(dateStr)) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function toggleHabitToday(habitId) {
    const habit = AppState.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    if (!habit.completedDates) habit.completedDates = [];
    
    const index = habit.completedDates.indexOf(today);
    if (index > -1) {
        habit.completedDates.splice(index, 1);
        showToast('Hábito desmarcado', 'info');
    } else {
        habit.completedDates.push(today);
        showToast('¡Hábito completado!', 'success');
    }
    
    saveToStorage('habits', AppState.habits);
    refreshDashboard();
}

function renderRecentNotes() {
    const container = document.getElementById('recentNotesList');
    const recentNotes = AppState.notes.slice(0, 3);
    
    if (recentNotes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pen"></i>
                <p>No hay notas recientes</p>
                <button class="btn btn-small" onclick="document.querySelector('[data-view=notes]').click()">Crear nota</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentNotes.map(note => `
        <div class="note-item-mini" style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-lg); margin-bottom: 0.5rem; cursor: pointer;" onclick="openNote('${note.id}')">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${note.title}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">${note.content.substring(0, 80)}...</div>
        </div>
    `).join('');
}

function openNote(noteId) {
    document.querySelector('[data-view="notes"]').click();
    setTimeout(() => {
        const noteItem = document.querySelector(`.note-item[data-id="${noteId}"]`);
        if (noteItem) noteItem.click();
    }, 100);
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    
    if (AppState.goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <p>No hay metas definidas</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.goals.slice(0, 3).map(goal => {
        const progress = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
        return `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 500;">${goal.title}</span>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">${goal.current}/${goal.target}</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderWeeklyProgressChart() {
    const ctx = document.getElementById('weeklyProgressChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (window.weeklyChart && typeof window.weeklyChart.destroy === 'function') {
        window.weeklyChart.destroy();
    }
    
    // Get last 7 days data
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const completed = AppState.tasks.filter(t => 
            t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === dateStr
        ).length;
        
        data.push(completed);
    }
    
    window.weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Tareas Completadas',
                data: data,
                backgroundColor: 'rgba(232, 168, 124, 0.6)',
                borderColor: 'rgba(232, 168, 124, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ========================================
// POMODORO TIMER
// ========================================

let pomodoroInterval = null;

function initPomodoro() {
    document.getElementById('pomodoroStart').addEventListener('click', startPomodoro);
    document.getElementById('pomodoroPause').addEventListener('click', pausePomodoro);
    document.getElementById('pomodoroReset').addEventListener('click', resetPomodoro);
    
    updatePomodoroDisplay();
    updatePomodoroSessionsToday();
}

function startPomodoro() {
    if (!AppState.pomodoroState.isRunning) {
        AppState.pomodoroState.isRunning = true;
        AppState.pomodoroState.isPaused = false;
        
        document.getElementById('pomodoroStart').disabled = true;
        document.getElementById('pomodoroPause').disabled = false;
        
        pomodoroInterval = setInterval(() => {
            if (AppState.pomodoroState.timeLeft > 0) {
                AppState.pomodoroState.timeLeft--;
                updatePomodoroDisplay();
            } else {
                completePomodoro();
            }
        }, 1000);
    }
}

function pausePomodoro() {
    if (AppState.pomodoroState.isRunning) {
        clearInterval(pomodoroInterval);
        AppState.pomodoroState.isRunning = false;
        AppState.pomodoroState.isPaused = true;
        
        document.getElementById('pomodoroStart').disabled = false;
        document.getElementById('pomodoroPause').disabled = true;
    }
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    AppState.pomodoroState.isRunning = false;
    AppState.pomodoroState.isPaused = false;
    AppState.pomodoroState.timeLeft = AppState.pomodoroState.isBreak ? 5 * 60 : 25 * 60;
    AppState.pomodoroState.totalTime = AppState.pomodoroState.timeLeft;
    
    document.getElementById('pomodoroStart').disabled = false;
    document.getElementById('pomodoroPause').disabled = true;
    
    updatePomodoroDisplay();
}

function completePomodoro() {
    clearInterval(pomodoroInterval);
    
    if (!AppState.pomodoroState.isBreak) {
        // Completed a work session
        AppState.pomodoroState.sessionsCompleted++;
        AppState.pomodoroSessions.push({
            date: new Date().toISOString(),
            duration: 25
        });
        saveToStorage('pomodoroSessions', AppState.pomodoroSessions);
        
        showToast('¡Sesión completada! Toma un descanso', 'success');
        
        // Start break
        AppState.pomodoroState.isBreak = true;
        AppState.pomodoroState.timeLeft = 5 * 60; // 5 minute break
        AppState.pomodoroState.totalTime = 5 * 60;
    } else {
        // Completed break
        showToast('¡Descanso terminado! Vuelve a trabajar', 'info');
        
        AppState.pomodoroState.isBreak = false;
        AppState.pomodoroState.timeLeft = 25 * 60;
        AppState.pomodoroState.totalTime = 25 * 60;
    }
    
    AppState.pomodoroState.isRunning = false;
    document.getElementById('pomodoroStart').disabled = false;
    document.getElementById('pomodoroPause').disabled = true;
    
    updatePomodoroDisplay();
    updatePomodoroSessionsToday();
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(AppState.pomodoroState.timeLeft / 60);
    const seconds = AppState.pomodoroState.timeLeft % 60;
    
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('pomodoroTime').textContent = display;
    
    const label = AppState.pomodoroState.isBreak ? 'Descanso' : 'Sesión de Trabajo';
    document.getElementById('pomodoroLabel').textContent = label;
    
    // Update progress circle
    const progress = 1 - (AppState.pomodoroState.timeLeft / AppState.pomodoroState.totalTime);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * (1 - progress);
    document.getElementById('pomodoroProgressBar').style.strokeDashoffset = offset;
}

function updatePomodoroSessionsToday() {
    const today = new Date().toDateString();
    const sessionsToday = AppState.pomodoroSessions.filter(s => 
        new Date(s.date).toDateString() === today
    ).length;
    
    document.getElementById('pomodoroSessionsToday').textContent = sessionsToday;
}

// ========================================
// TASKS MANAGEMENT
// ========================================

function initTasks() {
    document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal());
    document.getElementById('addQuickTask').addEventListener('click', () => openTaskModal());
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            renderTasks();
        });
    });
    
    // Search
    document.getElementById('taskSearch').addEventListener('input', renderTasks);
    
    // Task form
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    renderTasks();
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    
    if (taskId) {
        const task = AppState.tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('taskModalTitle').textContent = 'Editar Tarea';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
            form.dataset.editId = taskId;
        }
    } else {
        document.getElementById('taskModalTitle').textContent = 'Nueva Tarea';
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const task = {
        id: form.dataset.editId || Date.now().toString(),
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value,
        tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t),
        status: form.dataset.editId ? 
            AppState.tasks.find(t => t.id === form.dataset.editId).status : 
            'todo',
        createdAt: form.dataset.editId ? 
            AppState.tasks.find(t => t.id === form.dataset.editId).createdAt : 
            new Date().toISOString()
    };
    
    if (form.dataset.editId) {
        const index = AppState.tasks.findIndex(t => t.id === form.dataset.editId);
        AppState.tasks[index] = task;
        showToast('Tarea actualizada', 'success');
    } else {
        AppState.tasks.unshift(task);
        showToast('Tarea creada', 'success');
    }
    
    saveToStorage('tasks', AppState.tasks);
    closeModal('taskModal');
    renderTasks();
    refreshDashboard();
}

function renderTasks() {
    let tasks = [...AppState.tasks];
    
    // Apply filters
    const activeFilters = Array.from(document.querySelectorAll('.filter-btn.active'));
    const statusFilter = activeFilters.find(f => f.dataset.filter);
    const priorityFilter = activeFilters.find(f => f.dataset.priority);
    
    if (statusFilter) {
        const filter = statusFilter.dataset.filter;
        if (filter === 'pending') tasks = tasks.filter(t => t.status !== 'completed');
        if (filter === 'completed') tasks = tasks.filter(t => t.status === 'completed');
    }
    
    if (priorityFilter) {
        tasks = tasks.filter(t => t.priority === priorityFilter.dataset.priority);
    }
    
    // Search filter
    const searchTerm = document.getElementById('taskSearch').value.toLowerCase();
    if (searchTerm) {
        tasks = tasks.filter(t => 
            t.title.toLowerCase().includes(searchTerm) ||
            (t.description && t.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Group by status
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    renderTaskColumn('todoList', todoTasks);
    renderTaskColumn('inProgressList', inProgressTasks);
    renderTaskColumn('completedList', completedTasks);
    
    // Update counts
    document.getElementById('todoCount').textContent = todoTasks.length;
    document.getElementById('inProgressCount').textContent = inProgressTasks.length;
    document.getElementById('completedCount').textContent = completedTasks.length;
}

function renderTaskColumn(containerId, tasks) {
    const container = document.getElementById(containerId);
    
    if (tasks.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);"><i class="fas fa-inbox"></i><br>Sin tareas</div>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-item" draggable="true" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                ${task.dueDate ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}</span>` : ''}
                ${task.tags && task.tags.length > 0 ? `
                    <div class="task-tags">
                        ${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                <button class="btn-icon-small" onclick="openTaskModal('${task.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon-small" onclick="deleteTask('${task.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add drag and drop
    initTaskDragDrop();
}

function initTaskDragDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    const taskLists = document.querySelectorAll('.tasks-list');
    
    taskItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.dataset.id);
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });
    
    taskLists.forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        list.addEventListener('drop', (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = list.dataset.status;
            
            const task = AppState.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                if (newStatus === 'completed') {
                    task.completedAt = new Date().toISOString();
                }
                saveToStorage('tasks', AppState.tasks);
                renderTasks();
                refreshDashboard();
                showToast('Tarea actualizada', 'success');
            }
        });
    });
}

function deleteTask(taskId) {
    if (confirm('¿Eliminar esta tarea?')) {
        AppState.tasks = AppState.tasks.filter(t => t.id !== taskId);
        saveToStorage('tasks', AppState.tasks);
        renderTasks();
        refreshDashboard();
        showToast('Tarea eliminada', 'info');
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';
    
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

// ========================================
// NOTES MANAGEMENT
// ========================================

function initNotes() {
    document.getElementById('addNoteBtn').addEventListener('click', () => openNoteModal());
    document.getElementById('noteForm').addEventListener('submit', handleNoteSubmit);
    
    // Categories
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNotes();
        });
    });
    
    // Search
    document.getElementById('notesSearch').addEventListener('input', renderNotes);
    
    renderNotes();
}

function openNoteModal(noteId = null) {
    const modal = document.getElementById('noteModal');
    const form = document.getElementById('noteForm');
    
    if (noteId) {
        const note = AppState.notes.find(n => n.id === noteId);
        if (note) {
            document.getElementById('noteModalTitle').textContent = 'Editar Nota';
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteCategory').value = note.category;
            document.getElementById('noteContent').value = note.content;
            document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';
            form.dataset.editId = noteId;
        }
    } else {
        document.getElementById('noteModalTitle').textContent = 'Nueva Nota';
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function handleNoteSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const note = {
        id: form.dataset.editId || Date.now().toString(),
        title: document.getElementById('noteTitle').value,
        category: document.getElementById('noteCategory').value,
        content: document.getElementById('noteContent').value,
        tags: document.getElementById('noteTags').value.split(',').map(t => t.trim()).filter(t => t),
        createdAt: form.dataset.editId ? 
            AppState.notes.find(n => n.id === form.dataset.editId).createdAt : 
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (form.dataset.editId) {
        const index = AppState.notes.findIndex(n => n.id === form.dataset.editId);
        AppState.notes[index] = note;
        showToast('Nota actualizada', 'success');
    } else {
        AppState.notes.unshift(note);
        showToast('Nota creada', 'success');
    }
    
    saveToStorage('notes', AppState.notes);
    closeModal('noteModal');
    renderNotes();
}

function renderNotes() {
    let notes = [...AppState.notes];
    
    // Category filter
    const activeCategory = document.querySelector('.category-btn.active');
    if (activeCategory && activeCategory.dataset.category !== 'all') {
        notes = notes.filter(n => n.category === activeCategory.dataset.category);
    }
    
    // Search filter
    const searchTerm = document.getElementById('notesSearch').value.toLowerCase();
    if (searchTerm) {
        notes = notes.filter(n => 
            n.title.toLowerCase().includes(searchTerm) ||
            n.content.toLowerCase().includes(searchTerm)
        );
    }
    
    const container = document.getElementById('notesList');
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>No hay notas</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notes.map(note => `
        <div class="note-item" data-id="${note.id}" onclick="viewNoteDetail('${note.id}')">
            <div class="note-item-title">${note.title}</div>
            <div class="note-item-excerpt">${note.content.substring(0, 100)}...</div>
            <div class="note-item-meta">
                <span><i class="fas fa-folder"></i> ${note.category}</span>
                <span><i class="fas fa-clock"></i> ${new Date(note.updatedAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function viewNoteDetail(noteId) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (!note) return;
    
    const editor = document.getElementById('notesEditor');
    editor.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                <div>
                    <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">${note.title}</h2>
                    <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                        <span><i class="fas fa-folder"></i> ${note.category}</span>
                        <span><i class="fas fa-clock"></i> ${new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon" onclick="openNoteModal('${note.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteNote('${note.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${note.tags && note.tags.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            <div style="line-height: 1.8; white-space: pre-wrap; font-size: 1rem;">
                ${parseMarkdown(note.content)}
            </div>
        </div>
    `;
}

function parseMarkdown(text) {
    // Simple markdown parser
    return text
        .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.75rem; font-weight: 700; margin: 1.5rem 0 0.75rem;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: var(--bg-tertiary); padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: var(--font-mono);">$1</code>')
        .replace(/\n/g, '<br>');
}

function deleteNote(noteId) {
    if (confirm('¿Eliminar esta nota?')) {
        AppState.notes = AppState.notes.filter(n => n.id !== noteId);
        saveToStorage('notes', AppState.notes);
        renderNotes();
        document.getElementById('notesEditor').innerHTML = `
            <div class="empty-state-large">
                <i class="fas fa-pen-fancy"></i>
                <h3>Selecciona una nota o crea una nueva</h3>
            </div>
        `;
        showToast('Nota eliminada', 'info');
    }
}

// ========================================
// HABITS MANAGEMENT
// ========================================

function initHabits() {
    document.getElementById('addHabitBtn').addEventListener('click', () => openHabitModal());
    document.getElementById('habitForm').addEventListener('submit', handleHabitSubmit);
    renderHabits();
}

function openHabitModal(habitId = null) {
    const modal = document.getElementById('habitModal');
    const form = document.getElementById('habitForm');
    
    if (habitId) {
        const habit = AppState.habits.find(h => h.id === habitId);
        if (habit) {
            document.getElementById('habitName').value = habit.name;
            document.getElementById('habitDescription').value = habit.description || '';
            document.getElementById('habitFrequency').value = habit.frequency;
            document.getElementById('habitIcon').value = habit.icon;
            form.dataset.editId = habitId;
        }
    } else {
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function handleHabitSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const habit = {
        id: form.dataset.editId || Date.now().toString(),
        name: document.getElementById('habitName').value,
        description: document.getElementById('habitDescription').value,
        frequency: document.getElementById('habitFrequency').value,
        icon: document.getElementById('habitIcon').value,
        completedDates: form.dataset.editId ? 
            AppState.habits.find(h => h.id === form.dataset.editId).completedDates : 
            [],
        createdAt: form.dataset.editId ? 
            AppState.habits.find(h => h.id === form.dataset.editId).createdAt : 
            new Date().toISOString()
    };
    
    if (form.dataset.editId) {
        const index = AppState.habits.findIndex(h => h.id === form.dataset.editId);
        AppState.habits[index] = habit;
        showToast('Hábito actualizado', 'success');
    } else {
        AppState.habits.push(habit);
        showToast('Hábito creado', 'success');
    }
    
    saveToStorage('habits', AppState.habits);
    closeModal('habitModal');
    renderHabits();
}

function renderHabits() {
    const container = document.getElementById('habitsList');
    
    if (AppState.habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-seedling"></i>
                <p>No hay hábitos configurados</p>
                <button class="btn btn-primary" onclick="document.getElementById('addHabitBtn').click()">Crear tu primer hábito</button>
            </div>
        `;
        
        // Update stats
        document.getElementById('longestStreak').textContent = '0';
        document.getElementById('totalHabitsCompleted').textContent = '0';
        document.getElementById('completionRate').textContent = '0%';
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = AppState.habits.map(habit => {
        const streak = calculateHabitStreakIndividual(habit);
        const iconMap = {
            book: '📚',
            code: '💻',
            exercise: '🏃',
            meditation: '🧘',
            water: '💧',
            sleep: '😴',
            study: '📝'
        };
        
        // Last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()];
            const isCompleted = habit.completedDates && habit.completedDates.includes(dateStr);
            last7Days.push({ day: dayName, completed: isCompleted, date: dateStr });
        }
        
        return `
            <div class="habit-card">
                <div class="habit-header">
                    <div class="habit-info">
                        <div class="habit-name">${iconMap[habit.icon] || '📝'} ${habit.name}</div>
                        ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                    </div>
                    <div class="habit-streak">
                        <div class="habit-streak-number">${streak}</div>
                        <div class="habit-streak-label">días</div>
                    </div>
                </div>
                <div class="habit-progress">
                    ${last7Days.map(d => `
                        <div class="habit-day ${d.completed ? 'completed' : ''}" 
                             onclick="toggleHabitDate('${habit.id}', '${d.date}')"
                             title="${d.day}">
                            ${d.completed ? '<i class="fas fa-check"></i>' : d.day}
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn-icon-small" onclick="openHabitModal('${habit.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-small" onclick="deleteHabit('${habit.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    updateHabitStats();
}

function toggleHabitDate(habitId, dateStr) {
    const habit = AppState.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    if (!habit.completedDates) habit.completedDates = [];
    
    const index = habit.completedDates.indexOf(dateStr);
    if (index > -1) {
        habit.completedDates.splice(index, 1);
    } else {
        habit.completedDates.push(dateStr);
    }
    
    saveToStorage('habits', AppState.habits);
    renderHabits();
    refreshDashboard();
}

function updateHabitStats() {
    let longestStreak = 0;
    let totalCompleted = 0;
    
    AppState.habits.forEach(habit => {
        const streak = calculateHabitStreakIndividual(habit);
        if (streak > longestStreak) longestStreak = streak;
        if (habit.completedDates) totalCompleted += habit.completedDates.length;
    });
    
    document.getElementById('longestStreak').textContent = longestStreak;
    document.getElementById('totalHabitsCompleted').textContent = totalCompleted;
    
    // Completion rate (last 30 days)
    const last30Days = 30;
    const possibleCompletions = AppState.habits.length * last30Days;
    let actualCompletions = 0;
    
    AppState.habits.forEach(habit => {
        if (!habit.completedDates) return;
        
        for (let i = 0; i < last30Days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (habit.completedDates.includes(dateStr)) {
                actualCompletions++;
            }
        }
    });
    
    const rate = possibleCompletions > 0 ? Math.round((actualCompletions / possibleCompletions) * 100) : 0;
    document.getElementById('completionRate').textContent = rate + '%';
}

function deleteHabit(habitId) {
    if (confirm('¿Eliminar este hábito?')) {
        AppState.habits = AppState.habits.filter(h => h.id !== habitId);
        saveToStorage('habits', AppState.habits);
        renderHabits();
        refreshDashboard();
        showToast('Hábito eliminado', 'info');
    }
}

// ========================================
// CALENDAR MANAGEMENT
// ========================================

function initCalendar() {
    document.getElementById('calendarPrev').addEventListener('click', () => navigateCalendar(-1));
    document.getElementById('calendarNext').addEventListener('click', () => navigateCalendar(1));
    document.getElementById('calendarToday').addEventListener('click', () => {
        AppState.calendarDate = new Date();
        renderCalendar();
    });
    
    document.getElementById('addEventBtn').addEventListener('click', () => openEventModal());
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
    
    // View switchers
    document.querySelectorAll('.view-switch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-switch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.calendarView = btn.dataset.calendarView;
            renderCalendar();
        });
    });
    
    renderCalendar();
}

function navigateCalendar(direction) {
    if (AppState.calendarView === 'month') {
        AppState.calendarDate.setMonth(AppState.calendarDate.getMonth() + direction);
    } else if (AppState.calendarView === 'week') {
        AppState.calendarDate.setDate(AppState.calendarDate.getDate() + (direction * 7));
    } else if (AppState.calendarView === 'day') {
        AppState.calendarDate.setDate(AppState.calendarDate.getDate() + direction);
    }
    
    renderCalendar();
}

function renderCalendar() {
    if (AppState.calendarView === 'month') {
        renderMonthView();
    } else if (AppState.calendarView === 'week') {
        renderWeekView();
    } else if (AppState.calendarView === 'day') {
        renderDayView();
    }
}

function renderMonthView() {
    document.getElementById('calendarMonthView').style.display = 'block';
    document.getElementById('calendarWeekView').style.display = 'none';
    document.getElementById('calendarDayView').style.display = 'none';
    
    const year = AppState.calendarDate.getFullYear();
    const month = AppState.calendarDate.getMonth();
    
    document.getElementById('calendarTitle').textContent = 
        new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const cell = createCalendarDay(day, true);
        grid.appendChild(cell);
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dateStr = date.toISOString().split('T')[0];
        const hasEvents = AppState.events.some(e => e.date === dateStr);
        
        const cell = document.createElement('div');
        cell.className = `calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`;
        cell.innerHTML = `<div class="day-number">${day}</div>`;
        cell.addEventListener('click', () => {
            AppState.calendarDate = new Date(year, month, day);
            document.querySelector('[data-calendar-view="day"]').click();
        });
        grid.appendChild(cell);
    }
    
    // Next month days
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const cell = createCalendarDay(day, true);
        grid.appendChild(cell);
    }
}

function createCalendarDay(day, isOtherMonth = false) {
    const cell = document.createElement('div');
    cell.className = `calendar-day ${isOtherMonth ? 'other-month' : ''}`;
    cell.innerHTML = `<div class="day-number">${day}</div>`;
    return cell;
}

function renderWeekView() {
    document.getElementById('calendarMonthView').style.display = 'none';
    document.getElementById('calendarWeekView').style.display = 'block';
    document.getElementById('calendarDayView').style.display = 'none';
    
    // Week view implementation
    const weekStart = new Date(AppState.calendarDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    document.getElementById('calendarTitle').textContent = 
        `Semana del ${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
    
    const weekGrid = document.getElementById('weekGrid');
    weekGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">Vista semanal - En desarrollo</div>';
}

function renderDayView() {
    document.getElementById('calendarMonthView').style.display = 'none';
    document.getElementById('calendarWeekView').style.display = 'none';
    document.getElementById('calendarDayView').style.display = 'block';
    
    document.getElementById('calendarTitle').textContent = 
        AppState.calendarDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const dateStr = AppState.calendarDate.toISOString().split('T')[0];
    const dayEvents = AppState.events.filter(e => e.date === dateStr);
    
    const daySchedule = document.getElementById('daySchedule');
    
    if (dayEvents.length === 0) {
        daySchedule.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <p>No hay eventos para este día</p>
                <button class="btn btn-primary" onclick="document.getElementById('addEventBtn').click()">Agregar evento</button>
            </div>
        `;
        return;
    }
    
    daySchedule.innerHTML = dayEvents.map(event => `
        <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 1rem; border-left: 4px solid var(--${event.color || 'primary'});">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">${event.title}</h4>
                    ${event.description ? `<p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${event.description}</p>` : ''}
                    ${event.time ? `<div style="color: var(--text-tertiary); font-size: 0.875rem;"><i class="fas fa-clock"></i> ${event.time}</div>` : ''}
                </div>
                <button class="btn-icon-small" onclick="deleteEvent('${event.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openEventModal(eventId = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    
    if (eventId) {
        const event = AppState.events.find(e => e.id === eventId);
        if (event) {
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventTime').value = event.time || '';
            document.getElementById('eventColor').value = event.color || 'primary';
            form.dataset.editId = eventId;
        }
    } else {
        form.reset();
        document.getElementById('eventDate').value = AppState.calendarDate.toISOString().split('T')[0];
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function handleEventSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const event = {
        id: form.dataset.editId || Date.now().toString(),
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        color: document.getElementById('eventColor').value
    };
    
    if (form.dataset.editId) {
        const index = AppState.events.findIndex(e => e.id === form.dataset.editId);
        AppState.events[index] = event;
        showToast('Evento actualizado', 'success');
    } else {
        AppState.events.push(event);
        showToast('Evento creado', 'success');
    }
    
    saveToStorage('events', AppState.events);
    closeModal('eventModal');
    renderCalendar();
}

function deleteEvent(eventId) {
    if (confirm('¿Eliminar este evento?')) {
        AppState.events = AppState.events.filter(e => e.id !== eventId);
        saveToStorage('events', AppState.events);
        renderCalendar();
        showToast('Evento eliminado', 'info');
    }
}

// ========================================
// ROADMAP
// ========================================

function renderRoadmap() {
    renderTimeline();
    renderPythonRoadmap();
    initRoadmapAccordion();
}

function renderTimeline() {
    const container = document.getElementById('timelinePhases');
    const phases = [
        { month: 'Mes 1-3', title: 'Fundamentos' },
        { month: 'Mes 4-6', title: 'ML Clásico' },
        { month: 'Mes 7-9', title: 'Deep Learning' },
        { month: 'Mes 10-12', title: 'Preparación' }
    ];
    
    container.innerHTML = phases.map(phase => `
        <div class="timeline-phase">
            <h4>${phase.month}</h4>
            <p>${phase.title}</p>
        </div>
    `).join('');
}

function renderPythonRoadmap() {
    const container = document.getElementById('pythonRoadmap');
    const topics = [
        { title: 'Fundamentos de Python', desc: 'Variables, tipos de datos, listas, diccionarios, tuplas, bucles, condicionales, funciones', tags: ['4-6 semanas', 'Esencial'] },
        { title: 'Pandas para Análisis de Datos', desc: 'Series, DataFrames, lectura de CSV, selección con .loc/.iloc, filtrado, manejo de datos faltantes, agrupación con groupby(), combinar DataFrames', tags: ['3-4 semanas', 'Core'] },
        { title: 'NumPy', desc: 'Creación y operaciones con arrays, operaciones matemáticas vectorizadas', tags: ['2 semanas', 'Importante'] },
        { title: 'Visualización de Datos', desc: 'Matplotlib: gráficos de líneas y barras. Seaborn: histogramas, boxplots, heatmaps, pairplots', tags: ['2-3 semanas', 'Core'] },
        { title: 'SQL', desc: 'SELECT, FROM, WHERE, agregaciones (COUNT, SUM, AVG), GROUP BY, HAVING, JOINS', tags: ['3-4 semanas', 'Esencial'] }
    ];
    
    container.innerHTML = topics.map(topic => `
        <div class="roadmap-topic">
            <h4>${topic.title}</h4>
            <p>${topic.desc}</p>
            <div class="topic-tags">
                ${topic.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function initRoadmapAccordion() {
    document.querySelectorAll('.roadmap-section-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.fa-chevron-down');
            
            if (content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                icon.style.transform = 'rotate(0deg)';
            } else {
                content.classList.add('expanded');
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });
}

// ========================================
// RESOURCES MANAGEMENT
// ========================================

function initResources() {
    document.getElementById('addResourceBtn').addEventListener('click', () => openResourceModal());
    document.getElementById('resourceForm').addEventListener('submit', handleResourceSubmit);
    
    document.querySelectorAll('.resource-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.resource-category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderResources();
        });
    });
    
    renderResources();
}

function openResourceModal(resourceId = null) {
    const modal = document.getElementById('resourceModal');
    const form = document.getElementById('resourceForm');
    
    if (resourceId) {
        const resource = AppState.resources.find(r => r.id === resourceId);
        if (resource) {
            document.getElementById('resourceTitle').value = resource.title;
            document.getElementById('resourceType').value = resource.type;
            document.getElementById('resourceProgress').value = resource.progress || 0;
            document.getElementById('resourceUrl').value = resource.url || '';
            document.getElementById('resourceNotes').value = resource.notes || '';
            form.dataset.editId = resourceId;
        }
    } else {
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function handleResourceSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const resource = {
        id: form.dataset.editId || Date.now().toString(),
        title: document.getElementById('resourceTitle').value,
        type: document.getElementById('resourceType').value,
        progress: parseInt(document.getElementById('resourceProgress').value),
        url: document.getElementById('resourceUrl').value,
        notes: document.getElementById('resourceNotes').value,
        createdAt: form.dataset.editId ? 
            AppState.resources.find(r => r.id === form.dataset.editId).createdAt : 
            new Date().toISOString()
    };
    
    if (form.dataset.editId) {
        const index = AppState.resources.findIndex(r => r.id === form.dataset.editId);
        AppState.resources[index] = resource;
        showToast('Recurso actualizado', 'success');
    } else {
        AppState.resources.push(resource);
        showToast('Recurso agregado', 'success');
    }
    
    saveToStorage('resources', AppState.resources);
    closeModal('resourceModal');
    renderResources();
}

function renderResources() {
    let resources = [...AppState.resources];
    
    const activeType = document.querySelector('.resource-category-btn.active');
    if (activeType && activeType.dataset.resourceType !== 'all') {
        resources = resources.filter(r => r.type === activeType.dataset.resourceType);
    }
    
    const container = document.getElementById('resourcesGrid');
    
    if (resources.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-reader"></i>
                <p>No hay recursos guardados</p>
                <button class="btn btn-primary" onclick="document.getElementById('addResourceBtn').click()">Agregar primer recurso</button>
            </div>
        `;
        return;
    }
    
    const iconMap = {
        course: 'fa-graduation-cap',
        video: 'fa-video',
        article: 'fa-newspaper',
        book: 'fa-book',
        link: 'fa-link'
    };
    
    container.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <div class="resource-header">
                <div class="resource-icon">
                    <i class="fas ${iconMap[resource.type]}"></i>
                </div>
                <div style="flex: 1;">
                    <div class="resource-title">${resource.title}</div>
                    <div class="resource-type">${resource.type}</div>
                </div>
            </div>
            <div class="resource-progress">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${resource.progress}%;"></div>
                </div>
                <div class="progress-text">${resource.progress}% completado</div>
            </div>
            ${resource.url ? `
                <div style="margin-top: 1rem;">
                    <a href="${resource.url}" target="_blank" class="btn btn-outline btn-small" style="width: 100%;">
                        <i class="fas fa-external-link-alt"></i> Abrir
                    </a>
                </div>
            ` : ''}
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="btn-icon-small" onclick="openResourceModal('${resource.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon-small" onclick="deleteResource('${resource.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deleteResource(resourceId) {
    if (confirm('¿Eliminar este recurso?')) {
        AppState.resources = AppState.resources.filter(r => r.id !== resourceId);
        saveToStorage('resources', AppState.resources);
        renderResources();
        showToast('Recurso eliminado', 'info');
    }
}

// ========================================
// GOALS MANAGEMENT
// ========================================

function initGoals() {
    document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());
    document.getElementById('goalForm').addEventListener('submit', handleGoalSubmit);
}

function openGoalModal(goalId = null) {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    
    if (goalId) {
        const goal = AppState.goals.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalTarget').value = goal.target;
            document.getElementById('goalCurrent').value = goal.current;
            document.getElementById('goalDeadline').value = goal.deadline || '';
            form.dataset.editId = goalId;
        }
    } else {
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function handleGoalSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const goal = {
        id: form.dataset.editId || Date.now().toString(),
        title: document.getElementById('goalTitle').value,
        target: parseInt(document.getElementById('goalTarget').value),
        current: parseInt(document.getElementById('goalCurrent').value),
        deadline: document.getElementById('goalDeadline').value,
        createdAt: form.dataset.editId ? 
            AppState.goals.find(g => g.id === form.dataset.editId).createdAt : 
            new Date().toISOString()
    };
    
    if (form.dataset.editId) {
        const index = AppState.goals.findIndex(g => g.id === form.dataset.editId);
        AppState.goals[index] = goal;
        showToast('Meta actualizada', 'success');
    } else {
        AppState.goals.push(goal);
        showToast('Meta creada', 'success');
    }
    
    saveToStorage('goals', AppState.goals);
    closeModal('goalModal');
    renderGoals();
}

// ========================================
// ANALYTICS
// ========================================

function renderAnalytics() {
    renderProductivityChart();
    renderTimeDistributionChart();
    renderTasksStatusChart();
    renderPomodoroSessionsChart();
}

function renderProductivityChart() {
    const ctx = document.getElementById('productivityChart');
    if (!ctx) return;
    
    if (window.productivityChart && typeof window.productivityChart.destroy === 'function') {
        window.productivityChart.destroy();
    }
    
    const days = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));
        
        const dateStr = date.toISOString().split('T')[0];
        const completed = AppState.tasks.filter(t => 
            t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === dateStr
        ).length;
        data.push(completed);
    }
    
    window.productivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Tareas Completadas',
                data: data,
                borderColor: 'rgba(232, 168, 124, 1)',
                backgroundColor: 'rgba(232, 168, 124, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderTimeDistributionChart() {
    const ctx = document.getElementById('timeDistributionChart');
    if (!ctx) return;
    
    if (window.timeChart && typeof window.timeChart.destroy === 'function') {
        window.timeChart.destroy();
    }
    
    window.timeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Estudio Python', 'Proyectos', 'Cursos IA', 'Inglés', 'Otros'],
            datasets: [{
                data: [30, 25, 20, 15, 10],
                backgroundColor: [
                    'rgba(232, 168, 124, 0.8)',
                    'rgba(195, 141, 158, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 152, 0, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function renderTasksStatusChart() {
    const ctx = document.getElementById('tasksStatusChart');
    if (!ctx) return;
    
    if (window.tasksChart && typeof window.tasksChart.destroy === 'function') {
        window.tasksChart.destroy();
    }
    
    const todo = AppState.tasks.filter(t => t.status === 'todo').length;
    const inProgress = AppState.tasks.filter(t => t.status === 'in-progress').length;
    const completed = AppState.tasks.filter(t => t.status === 'completed').length;
    
    window.tasksChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Por Hacer', 'En Progreso', 'Completadas'],
            datasets: [{
                label: 'Tareas',
                data: [todo, inProgress, completed],
                backgroundColor: [
                    'rgba(255, 152, 0, 0.6)',
                    'rgba(33, 150, 243, 0.6)',
                    'rgba(76, 175, 80, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderPomodoroSessionsChart() {
    const ctx = document.getElementById('pomodoroSessionsChart');
    if (!ctx) return;
    
    if (window.pomodoroChart && typeof window.pomodoroChart.destroy === 'function') {
        window.pomodoroChart.destroy();
    }
    
    const days = [];
    const data = [];
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.getDate());
        
        const dateStr = date.toDateString();
        const sessions = AppState.pomodoroSessions.filter(s => 
            new Date(s.date).toDateString() === dateStr
        ).length;
        data.push(sessions);
    }
    
    window.pomodoroChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Sesiones Pomodoro',
                data: data,
                backgroundColor: 'rgba(232, 168, 124, 0.6)',
                borderColor: 'rgba(232, 168, 124, 1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ========================================
// EXPORT DATA
// ========================================

function initExport() {
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        document.getElementById('exportModal').classList.add('active');
    });
    
    document.getElementById('exportJSON').addEventListener('click', exportAsJSON);
    document.getElementById('exportCSV').addEventListener('click', exportAsCSV);
}

function exportAsJSON() {
    const data = {
        tasks: AppState.tasks,
        notes: AppState.notes,
        habits: AppState.habits,
        events: AppState.events,
        resources: AppState.resources,
        goals: AppState.goals,
        pomodoroSessions: AppState.pomodoroSessions,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-pasantia-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    closeModal('exportModal');
    showToast('Datos exportados en JSON', 'success');
}

function exportAsCSV() {
    // Export tasks as CSV
    let csv = 'Título,Descripción,Prioridad,Estado,Fecha Límite,Etiquetas\n';
    
    AppState.tasks.forEach(task => {
        csv += `"${task.title}","${task.description || ''}","${task.priority}","${task.status}","${task.dueDate || ''}","${task.tags ? task.tags.join(';') : ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tareas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    closeModal('exportModal');
    showToast('Tareas exportadas en CSV', 'success');
}

// ========================================
// AI FEATURES
// ========================================

async function initAI() {
    await AI.init();
    
    const aiChatToggle = document.getElementById('aiChatToggle');
    const aiChatPanel = document.getElementById('aiChatPanel');
    const aiChatClose = document.getElementById('aiChatClose');
    const aiChatSend = document.getElementById('aiChatSend');
    const aiChatInput = document.getElementById('aiChatInputField');
    
    aiChatToggle.addEventListener('click', () => {
        aiChatPanel.classList.toggle('active');
    });
    
    aiChatClose.addEventListener('click', () => {
        aiChatPanel.classList.remove('active');
    });
    
    aiChatSend.addEventListener('click', () => sendAIMessage());
    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendAIMessage();
    });
    
    document.querySelectorAll('.ai-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            aiChatInput.value = btn.dataset.suggestion;
            sendAIMessage();
        });
    });
}

async function sendAIMessage() {
    const input = document.getElementById('aiChatInputField');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messagesContainer = document.getElementById('aiChatMessages');
    
    messagesContainer.innerHTML += `
        <div class="user-message">
            <div class="user-avatar"><i class="fas fa-user"></i></div>
            <div class="user-message-content">${message}</div>
        </div>
    `;
    
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        const response = await AI.chat(message);
        
        messagesContainer.innerHTML += `
            <div class="ai-message">
                <div class="ai-avatar"><i class="fas fa-robot"></i></div>
                <div class="ai-message-content">${response}</div>
            </div>
        `;
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error AI:', error);
        showToast('Error al comunicarse con la IA', 'error');
    }
}

async function generateSmartTasks() {
    const goal = prompt('¿Qué meta quieres lograr?');
    if (!goal) return;
    
    showLoading(true);
    
    try {
        const context = {
            currentTasks: AppState.tasks.length,
            level: 'Intermedio'
        };
        
        const tasks = await AI.generateTasks(goal, context);
        
        tasks.forEach(task => {
            const newTask = {
                id: Date.now().toString() + Math.random(),
                title: task.title,
                description: task.description,
                priority: task.priority || 'medium',
                tags: task.tags || [],
                status: 'todo',
                createdAt: new Date().toISOString()
            };
            AppState.tasks.unshift(newTask);
        });
        
        saveToStorage('tasks', AppState.tasks);
        renderTasks();
        refreshDashboard();
        showLoading(false);
        showToast(`✨ ${tasks.length} tareas generadas con IA`, 'success');
    } catch (error) {
        showLoading(false);
        showToast('Error al generar tareas', 'error');
        console.error(error);
    }
}

async function showAIInsights() {
    document.getElementById('aiInsightsModal').classList.add('active');
    const content = document.getElementById('aiInsightsContent');
    
    content.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analizando tus datos...</p>
        </div>
    `;
    
    try {
        const today = new Date().toDateString();
        const completedToday = AppState.tasks.filter(t => 
            t.completedAt && new Date(t.completedAt).toDateString() === today
        ).length;
        
        const data = {
            completedTasks: completedToday,
            pendingTasks: AppState.tasks.filter(t => t.status !== 'completed').length,
            pomodoroSessions: AppState.pomodoroSessions.length,
            habitStreak: calculateHabitStreak(),
            studyHours: Math.floor((AppState.pomodoroSessions.length * 25) / 60)
        };
        
        const insights = await AI.analyzeProductivity(data);
        
        content.innerHTML = `
            <div style="padding: 2rem;">
                <div style="background: var(--primary-light); padding: 1.5rem; border-radius: var(--radius-xl); margin-bottom: 1.5rem;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-brain"></i> Análisis de IA
                    </h3>
                    <p style="line-height: 1.8; white-space: pre-wrap;">${insights}</p>
                </div>
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--success);">${data.completedTasks}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Completadas Hoy</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">${data.pomodoroSessions}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Sesiones Pomodoro</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--warning);">${data.habitStreak}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Días de Racha</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--info);">${data.studyHours}h</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Horas de Estudio</div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <p>Error al generar insights. Verifica tu API key de Gemini.</p>
            </div>
        `;
    }
}

// ========================================
// QUICK CAPTURE
// ========================================

function initQuickCapture() {
    const btn = document.getElementById('quickCaptureBtn');
    const panel = document.getElementById('quickCapturePanel');
    const closeBtn = document.getElementById('quickCaptureClose');
    const text = document.getElementById('quickCaptureText');
    const asTaskBtn = document.getElementById('quickCaptureAsTask');
    const asNoteBtn = document.getElementById('quickCaptureAsNote');
    
    btn.addEventListener('click', () => {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            text.focus();
        }
    });
    
    closeBtn.addEventListener('click', () => {
        panel.classList.remove('active');
    });
    
    asTaskBtn.addEventListener('click', () => {
        const content = text.value.trim();
        if (!content) return;
        
        const task = {
            id: Date.now().toString(),
            title: content.substring(0, 100),
            description: content.length > 100 ? content : '',
            priority: 'medium',
            status: 'todo',
            createdAt: new Date().toISOString(),
            tags: []
        };
        
        AppState.tasks.unshift(task);
        saveToStorage('tasks', AppState.tasks);
        renderTasks();
        refreshDashboard();
        
        text.value = '';
        panel.classList.remove('active');
        showToast('✅ Tarea creada desde captura rápida', 'success');
        checkAchievement('first_quick_capture');
    });
    
    asNoteBtn.addEventListener('click', () => {
        const content = text.value.trim();
        if (!content) return;
        
        const note = {
            id: Date.now().toString(),
            title: content.substring(0, 50),
            content: content,
            category: 'personal',
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        AppState.notes.unshift(note);
        saveToStorage('notes', AppState.notes);
        renderNotes();
        
        text.value = '';
        panel.classList.remove('active');
        showToast('✅ Nota creada desde captura rápida', 'success');
    });
}

// ========================================
// GLOBAL SEARCH
// ========================================

function initGlobalSearch() {
    const modal = document.getElementById('globalSearchModal');
    const input = document.getElementById('globalSearchInput');
    const results = document.getElementById('globalSearchResults');
    
    input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        
        if (!query) {
            results.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Escribe para buscar en toda tu información</p>
                </div>
            `;
            return;
        }
        
        const allResults = [];
        
        AppState.tasks.forEach(task => {
            if (task.title.toLowerCase().includes(query) || 
                (task.description && task.description.toLowerCase().includes(query))) {
                allResults.push({
                    type: 'Tarea',
                    title: task.title,
                    excerpt: task.description || '',
                    action: () => {
                        document.querySelector('[data-view="tasks"]').click();
                        modal.classList.remove('active');
                    }
                });
            }
        });
        
        AppState.notes.forEach(note => {
            if (note.title.toLowerCase().includes(query) || 
                note.content.toLowerCase().includes(query)) {
                allResults.push({
                    type: 'Nota',
                    title: note.title,
                    excerpt: note.content.substring(0, 100),
                    action: () => {
                        document.querySelector('[data-view="notes"]').click();
                        setTimeout(() => viewNoteDetail(note.id), 100);
                        modal.classList.remove('active');
                    }
                });
            }
        });
        
        AppState.resources.forEach(resource => {
            if (resource.title.toLowerCase().includes(query)) {
                allResults.push({
                    type: 'Recurso',
                    title: resource.title,
                    excerpt: resource.notes || resource.url || '',
                    action: () => {
                        document.querySelector('[data-view="resources"]').click();
                        modal.classList.remove('active');
                    }
                });
            }
        });
        
        if (allResults.length === 0) {
            results.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search-minus"></i>
                    <p>No se encontraron resultados para "${query}"</p>
                </div>
            `;
            return;
        }
        
        results.innerHTML = allResults.slice(0, 20).map(result => `
            <div class="search-result-item" onclick='${result.action.toString().replace(/'/g, "\\'")}'>
                <div class="search-result-header">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-type">${result.type}</div>
                </div>
                <div class="search-result-excerpt">${result.excerpt}</div>
            </div>
        `).join('');
        
        document.querySelectorAll('.search-result-item').forEach((el, i) => {
            el.onclick = allResults[i].action;
        });
    });
}

// ========================================
// FOCUS MODE
// ========================================

function initFocusMode() {
    const overlay = document.getElementById('focusModeOverlay');
    const exitBtn = document.getElementById('exitFocusMode');
    let focusTimer = null;
    let focusTimeLeft = 25 * 60;
    
    window.enterFocusMode = function(taskTitle = 'Sesión de Enfoque') {
        document.getElementById('focusTaskTitle').textContent = taskTitle;
        overlay.classList.add('active');
        focusTimeLeft = 25 * 60;
        updateFocusTimer();
    };
    
    exitBtn.addEventListener('click', () => {
        if (focusTimer) clearInterval(focusTimer);
        overlay.classList.remove('active');
    });
    
    document.getElementById('focusStart').addEventListener('click', () => {
        if (focusTimer) clearInterval(focusTimer);
        
        focusTimer = setInterval(() => {
            focusTimeLeft--;
            updateFocusTimer();
            
            if (focusTimeLeft <= 0) {
                clearInterval(focusTimer);
                overlay.classList.remove('active');
                showAchievement('¡Sesión Completada!', 'Has completado una sesión de enfoque');
            }
        }, 1000);
    });
    
    function updateFocusTimer() {
        const mins = Math.floor(focusTimeLeft / 60);
        const secs = focusTimeLeft % 60;
        document.getElementById('focusTimer').textContent = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// ========================================
// ACHIEVEMENTS & GAMIFICATION
// ========================================

const Achievements = {
    first_task: { title: '¡Primera Tarea!', desc: 'Has creado tu primera tarea', unlocked: false },
    first_complete: { title: 'Completador', desc: 'Completaste tu primera tarea', unlocked: false },
    task_master: { title: 'Maestro de Tareas', desc: 'Has completado 10 tareas', unlocked: false },
    week_streak: { title: 'Racha Semanal', desc: '7 días seguidos con hábitos completados', unlocked: false },
    pomodoro_pro: { title: 'Pomodoro Pro', desc: '25 sesiones Pomodoro completadas', unlocked: false },
    note_taker: { title: 'Tomador de Notas', desc: 'Has creado 10 notas', unlocked: false },
    early_bird: { title: 'Madrugador', desc: 'Completaste una tarea antes de las 8 AM', unlocked: false },
    night_owl: { title: 'Noctámbulo', desc: 'Trabajaste después de las 10 PM', unlocked: false },
    first_quick_capture: { title: 'Captura Rápida', desc: 'Usaste la captura rápida por primera vez', unlocked: false }
};

function checkAchievement(key) {
    if (!Achievements[key] || Achievements[key].unlocked) return;
    
    let unlock = false;
    
    switch(key) {
        case 'first_task':
            unlock = AppState.tasks.length >= 1;
            break;
        case 'first_complete':
            unlock = AppState.tasks.some(t => t.status === 'completed');
            break;
        case 'task_master':
            unlock = AppState.tasks.filter(t => t.status === 'completed').length >= 10;
            break;
        case 'week_streak':
            unlock = calculateHabitStreak() >= 7;
            break;
        case 'pomodoro_pro':
            unlock = AppState.pomodoroSessions.length >= 25;
            break;
        case 'note_taker':
            unlock = AppState.notes.length >= 10;
            break;
        case 'first_quick_capture':
            unlock = true;
            break;
    }
    
    if (unlock) {
        Achievements[key].unlocked = true;
        localStorage.setItem('achievements', JSON.stringify(Achievements));
        showAchievement(Achievements[key].title, Achievements[key].desc);
    }
}

function showAchievement(title, description) {
    const toast = document.getElementById('achievementToast');
    document.getElementById('achievementTitle').textContent = title;
    document.getElementById('achievementDescription').textContent = description;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (!(e.ctrlKey || e.metaKey)) return;
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('globalSearchModal').classList.add('active');
            document.getElementById('globalSearchInput').focus();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            document.getElementById('quickCapturePanel').classList.toggle('active');
            document.getElementById('quickCaptureText').focus();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === '1') {
            e.preventDefault();
            document.querySelector('[data-view="dashboard"]').click();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === '2') {
            e.preventDefault();
            document.querySelector('[data-view="tasks"]').click();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === '3') {
            e.preventDefault();
            document.querySelector('[data-view="notes"]').click();
        }
    });
}

// ========================================
// AUTO BACKUP
// ========================================

function initAutoBackup() {
    setInterval(() => {
        const data = {
            tasks: AppState.tasks,
            notes: AppState.notes,
            habits: AppState.habits,
            events: AppState.events,
            resources: AppState.resources,
            goals: AppState.goals,
            pomodoroSessions: AppState.pomodoroSessions,
            backupDate: new Date().toISOString()
        };
        
        localStorage.setItem('autoBackup', JSON.stringify(data));
        console.log('✅ Backup automático guardado');
    }, 5 * 60 * 1000);
}

function restoreFromBackup() {
    const backup = localStorage.getItem('autoBackup');
    if (!backup) {
        showToast('No hay backup disponible', 'warning');
        return;
    }
    
    if (confirm('¿Restaurar desde el último backup automático? Esto sobrescribirá los datos actuales.')) {
        const data = JSON.parse(backup);
        
        AppState.tasks = data.tasks || [];
        AppState.notes = data.notes || [];
        AppState.habits = data.habits || [];
        AppState.events = data.events || [];
        AppState.resources = data.resources || [];
        AppState.goals = data.goals || [];
        AppState.pomodoroSessions = data.pomodoroSessions || [];
        
        Object.keys(data).forEach(key => {
            if (key !== 'backupDate') {
                saveToStorage(key, data[key]);
            }
        });
        
        location.reload();
    }
}

// ========================================
// UTILITIES
// ========================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// ========================================
// MODAL MANAGEMENT
// ========================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Close modal buttons
document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) modal.classList.remove('active');
    });
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initTheme();
    initPomodoro();
    initTasks();
    initNotes();
    initHabits();
    initCalendar();
    initResources();
    initGoals();
    initExport();
    
    await initAI();
    initQuickCapture();
    initGlobalSearch();
    initFocusMode();
    initKeyboardShortcuts();
    initAutoBackup();
    
    window.generateSmartTasks = generateSmartTasks;
    window.showAIInsights = showAIInsights;
    window.restoreFromBackup = restoreFromBackup;
    
    refreshDashboard();
    
    setTimeout(() => {
        checkAchievement('first_task');
        checkAchievement('task_master');
        checkAchievement('note_taker');
        checkAchievement('pomodoro_pro');
        checkAchievement('week_streak');
    }, 1000);
    
    console.log('✅ Plan de Pasantía IA - Sistema Inicializado');
    console.log('🤖 Funcionalidades de IA:', AI.apiKey ? 'Activadas' : 'Desactivadas (verifica GEMINI_API_KEY)');
    console.log('⌨️  Atajos: Ctrl+K (Buscar), Ctrl+Shift+N (Captura Rápida), Ctrl+1-3 (Navegación)');
    showToast('¡Bienvenido a tu Centro de Productividad Mejorado con IA!', 'success');
});
