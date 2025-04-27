// TaskFlow App - Main JavaScript File

// Task Model
class Task {
    constructor(id, title, description, date, time, priority, category, completed = false) {
      this.id = id
      this.title = title
      this.description = description
      this.date = date
      this.time = time
      this.priority = priority
      this.category = category
      this.completed = completed
    }
  
    get dateTime() {
      return new Date(`${this.date}T${this.time}`)
    }
  
    get formattedDateTime() {
      const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
      return this.dateTime.toLocaleString(undefined, options)
    }
  
    get isOverdue() {
      return !this.completed && this.dateTime < new Date()
    }
  }
  
  // TaskManager - Handles all task operations
  class TaskManager {
    constructor() {
      this.tasks = []
      this.loadTasks()
    }
  
    loadTasks() {
      const savedTasks = localStorage.getItem("taskflow-tasks")
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        this.tasks = parsedTasks.map(
          (task) =>
            new Task(
              task.id,
              task.title,
              task.description,
              task.date,
              task.time,
              task.priority,
              task.category,
              task.completed,
            ),
        )
      }
    }
  
    saveTasks() {
      localStorage.setItem("taskflow-tasks", JSON.stringify(this.tasks))
    }
  
    addTask(title, description, date, time, priority, category) {
      const id = Date.now().toString()
      const task = new Task(id, title, description, date, time, priority, category)
      this.tasks.push(task)
      this.saveTasks()
      return task
    }
  
    getTaskById(id) {
      return this.tasks.find((task) => task.id === id)
    }
  
    updateTask(id, updates) {
      const taskIndex = this.tasks.findIndex((task) => task.id === id)
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates }
        this.saveTasks()
        return this.tasks[taskIndex]
      }
      return null
    }
  
    deleteTask(id) {
      const taskIndex = this.tasks.findIndex((task) => task.id === id)
      if (taskIndex !== -1) {
        this.tasks.splice(taskIndex, 1)
        this.saveTasks()
        return true
      }
      return false
    }
  
    toggleTaskStatus(id) {
      const task = this.getTaskById(id)
      if (task) {
        task.completed = !task.completed
        this.saveTasks()
        return task
      }
      return null
    }
  
    getAllTasks() {
      return [...this.tasks]
    }
  
    getTasksByDate(date) {
      return this.tasks.filter((task) => task.date === date)
    }
  
    getTasksByCategory(category) {
      if (category === "all") return this.getAllTasks()
      return this.tasks.filter((task) => task.category === category)
    }
  
    getTasksForWeek(startDate) {
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
  
      return this.tasks.filter((task) => {
        const taskDate = new Date(task.date)
        return taskDate >= startDate && taskDate <= endDate
      })
    }
  
    sortTasks(tasks, sortBy) {
      if (sortBy === "date") {
        return [...tasks].sort((a, b) => a.dateTime - b.dateTime)
      } else if (sortBy === "priority") {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 }
        return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      }
      return tasks
    }
  }
  
  // UI Manager - Handles all UI operations
  class UIManager {
    constructor(taskManager) {
      this.taskManager = taskManager
      this.currentView = "dashboard"
      this.currentTaskId = null
      this.currentDate = new Date()
      this.weekStartDate = this.getStartOfWeek(new Date())
      this.initEventListeners()
      this.renderDashboard()
    }
  
    // Initialize all event listeners
    initEventListeners() {
      // Sidebar navigation
      document.querySelectorAll(".sidebar-menu li").forEach((item) => {
        item.addEventListener("click", () => this.changeView(item.dataset.view))
      })
  
      // Sidebar toggle
      document.getElementById("sidebar-toggle").addEventListener("click", this.toggleSidebar.bind(this))
  
      // Theme toggle
      document.getElementById("theme-toggle").addEventListener("click", this.toggleTheme.bind(this))
  
      // Add task button
      document.getElementById("add-task-btn").addEventListener("click", this.showAddTaskModal.bind(this))
  
      // Save task button
      document.getElementById("save-task-btn").addEventListener("click", this.saveTask.bind(this))
  
      // Task details view buttons
      document.getElementById("edit-task-btn").addEventListener("click", () => {
        this.showEditTaskModal(this.currentTaskId)
      })
  
      document.getElementById("toggle-status-btn").addEventListener("click", () => {
        this.toggleTaskStatus(this.currentTaskId)
      })
  
      document.getElementById("delete-task-btn").addEventListener("click", () => {
        this.deleteTask(this.currentTaskId)
      })
  
      document.getElementById("back-to-dashboard").addEventListener("click", () => {
        this.changeView("dashboard")
      })
  
      // Filter and sort events
      document.getElementById("sort-by").addEventListener("change", this.renderDashboard.bind(this))
      document.getElementById("filter-category").addEventListener("change", this.renderDashboard.bind(this))
      document.getElementById("filter-date").addEventListener("change", this.renderDashboard.bind(this))
      document.getElementById("clear-filters").addEventListener("click", this.clearFilters.bind(this))
  
      // Daily view navigation
      document.getElementById("prev-day").addEventListener("click", () => {
        this.currentDate.setDate(this.currentDate.getDate() - 1)
        this.renderDailyView()
      })
  
      document.getElementById("next-day").addEventListener("click", () => {
        this.currentDate.setDate(this.currentDate.getDate() + 1)
        this.renderDailyView()
      })
  
      // Weekly view navigation
      document.getElementById("prev-week").addEventListener("click", () => {
        this.weekStartDate.setDate(this.weekStartDate.getDate() - 7)
        this.renderWeeklyView()
      })
  
      document.getElementById("next-week").addEventListener("click", () => {
        this.weekStartDate.setDate(this.weekStartDate.getDate() + 7)
        this.renderWeeklyView()
      })
    }
  
    // Toggle sidebar visibility
    toggleSidebar() {
      const sidebar = document.getElementById("sidebar")
      sidebar.classList.toggle("active")
    }
  
    // Toggle between light and dark theme
    toggleTheme() {
      document.body.classList.toggle("dark-mode")
      const themeToggle = document.getElementById("theme-toggle")
  
      if (document.body.classList.contains("dark-mode")) {
        themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i> Light Mode'
        localStorage.setItem("taskflow-theme", "dark")
      } else {
        themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i> Dark Mode'
        localStorage.setItem("taskflow-theme", "light")
      }
    }
  
    // Change the current view
    changeView(view) {
      // Update active menu item
      document.querySelectorAll(".sidebar-menu li").forEach((item) => {
        item.classList.remove("active")
        if (item.dataset.view === view) {
          item.classList.add("active")
        }
      })
  
      // Hide all views
      document.querySelectorAll(".content-view").forEach((view) => {
        view.classList.remove("active")
      })
  
      // Show selected view
      this.currentView = view
  
      // Update top bar title
      const topBarTitle = document.querySelector(".top-bar-title")
  
      switch (view) {
        case "dashboard":
          document.getElementById("dashboard-view").classList.add("active")
          topBarTitle.textContent = "Dashboard"
          this.renderDashboard()
          break
        case "daily":
          document.getElementById("daily-view").classList.add("active")
          topBarTitle.textContent = "Daily View"
          this.renderDailyView()
          break
        case "weekly":
          document.getElementById("weekly-view").classList.add("active")
          topBarTitle.textContent = "Weekly View"
          this.renderWeeklyView()
          break
        case "task-details":
          document.getElementById("task-details-view").classList.add("active")
          topBarTitle.textContent = "Task Details"
          break
      }
    }
  
    // Show the add task modal
    showAddTaskModal() {
      // Reset form
      document.getElementById("task-form").reset()
      document.getElementById("task-id").value = ""
      document.getElementById("task-modal-title").textContent = "Add New Task"
  
      // Set default date to today
      const today = new Date().toISOString().split("T")[0]
      document.getElementById("task-date").value = today
  
      // Show modal
      const taskModalElement = document.getElementById("task-modal")
      const taskModal = new bootstrap.Modal(taskModalElement)
      taskModal.show()
    }
  
    // Show the edit task modal
    showEditTaskModal(taskId) {
      const task = this.taskManager.getTaskById(taskId)
      if (!task) return
  
      document.getElementById("task-id").value = task.id
      document.getElementById("task-title").value = task.title
      document.getElementById("task-description").value = task.description || ""
      document.getElementById("task-date").value = task.date
      document.getElementById("task-time").value = task.time
      document.getElementById("task-priority").value = task.priority
      document.getElementById("task-category").value = task.category
  
      document.getElementById("task-modal-title").textContent = "Edit Task"
  
      const taskModalElement = document.getElementById("task-modal")
      const taskModal = new bootstrap.Modal(taskModalElement)
      taskModal.show()
    }
  
    // Save a new or edited task
    saveTask() {
      const taskId = document.getElementById("task-id").value
      const title = document.getElementById("task-title").value
      const description = document.getElementById("task-description").value
      const date = document.getElementById("task-date").value
      const time = document.getElementById("task-time").value
      const priority = document.getElementById("task-priority").value
      const category = document.getElementById("task-category").value
  
      if (!title || !date || !time || !priority || !category) {
        alert("Please fill in all required fields")
        return
      }
  
      if (taskId) {
        // Update existing task
        this.taskManager.updateTask(taskId, {
          title,
          description,
          date,
          time,
          priority,
          category,
        })
  
        // If we're in task details view, update it
        if (this.currentView === "task-details" && this.currentTaskId === taskId) {
          this.showTaskDetails(taskId)
        }
      } else {
        // Add new task
        this.taskManager.addTask(title, description, date, time, priority, category)
      }
  
      // Close modal
      const taskModalElement = document.getElementById("task-modal")
      const taskModal = bootstrap.Modal.getInstance(taskModalElement)
      taskModal.hide()
  
      // Refresh current view
      if (this.currentView === "dashboard") {
        this.renderDashboard()
      } else if (this.currentView === "daily") {
        this.renderDailyView()
      } else if (this.currentView === "weekly") {
        this.renderWeeklyView()
      }
    }
  
    // Toggle task completion status
    toggleTaskStatus(taskId) {
      const task = this.taskManager.toggleTaskStatus(taskId)
      if (task && this.currentView === "task-details") {
        this.showTaskDetails(taskId)
      }
  
      // Refresh current view
      if (this.currentView === "dashboard") {
        this.renderDashboard()
      } else if (this.currentView === "daily") {
        this.renderDailyView()
      } else if (this.currentView === "weekly") {
        this.renderWeeklyView()
      }
    }
  
    // Delete a task
    deleteTask(taskId) {
      if (confirm("Are you sure you want to delete this task?")) {
        this.taskManager.deleteTask(taskId)
  
        // Go back to dashboard
        this.changeView("dashboard")
      }
    }
  
    // Show task details
    showTaskDetails(taskId) {
      const task = this.taskManager.getTaskById(taskId)
      if (!task) return
  
      this.currentTaskId = taskId
  
      document.getElementById("task-details-title").textContent = task.title
      document.getElementById("task-details-description").textContent = task.description || "No description"
      document.getElementById("task-details-datetime").textContent = task.formattedDateTime
      document.getElementById("task-details-priority").textContent = task.priority
      document.getElementById("task-details-category").textContent = task.category
      document.getElementById("task-details-status").textContent = task.completed ? "Completed" : "Pending"
  
      const statusBtn = document.getElementById("toggle-status-btn")
      if (task.completed) {
        statusBtn.textContent = "Mark as Pending"
        statusBtn.classList.remove("btn-success")
        statusBtn.classList.add("btn-warning")
      } else {
        statusBtn.textContent = "Mark as Completed"
        statusBtn.classList.remove("btn-warning")
        statusBtn.classList.add("btn-success")
      }
  
      this.changeView("task-details")
    }
  
    // Render the dashboard view
    renderDashboard() {
      const tasksContainer = document.getElementById("tasks-container")
      tasksContainer.innerHTML = ""
  
      // Get filter values
      const sortBy = document.getElementById("sort-by").value
      const filterCategory = document.getElementById("filter-category").value
      const filterDate = document.getElementById("filter-date").value
  
      // Get and filter tasks
      let tasks = this.taskManager.getAllTasks()
  
      if (filterCategory !== "all") {
        tasks = tasks.filter((task) => task.category === filterCategory)
      }
  
      if (filterDate) {
        tasks = tasks.filter((task) => task.date === filterDate)
      }
  
      // Sort tasks
      tasks = this.taskManager.sortTasks(tasks, sortBy)
  
      if (tasks.length === 0) {
        tasksContainer.innerHTML = '<div class="no-tasks-message">No tasks found. Add a new task to get started!</div>'
        return
      }
  
      // Render each task
      tasks.forEach((task) => {
        const taskCard = document.createElement("div")
        taskCard.className = `task-card priority-${task.priority.toLowerCase()}`
        if (task.completed) {
          taskCard.classList.add("completed")
        }
  
        taskCard.innerHTML = `
          <div class="task-title">${task.title}</div>
          <div class="task-info">
            <span>${task.formattedDateTime}</span>
            ${task.completed ? "<span>Completed</span>" : ""}
          </div>
          <div class="task-description">${task.description || "No description"}</div>
          <div class="task-badges">
            <span class="task-badge badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
            <span class="task-badge badge-category">${task.category}</span>
            ${task.isOverdue ? '<span class="task-badge badge-priority-high">Overdue</span>' : ""}
          </div>
        `
  
        taskCard.addEventListener("click", () => {
          this.showTaskDetails(task.id)
        })
  
        tasksContainer.appendChild(taskCard)
      })
    }
  
    // Render the daily view
    renderDailyView() {
      const dailyTimeline = document.getElementById("daily-timeline")
      dailyTimeline.innerHTML = ""
  
      // Update date display
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      document.getElementById("current-date").textContent = this.currentDate.toLocaleDateString(undefined, options)
  
      // Format date for filtering
      const dateString = this.currentDate.toISOString().split("T")[0]
  
      // Get tasks for this day
      const tasks = this.taskManager.getTasksByDate(dateString)
  
      // Create timeline hours (6 AM to 10 PM)
      for (let hour = 6; hour <= 22; hour++) {
        const timeBlock = document.createElement("div")
        timeBlock.className = "timeline-hour"
  
        const hourLabel = document.createElement("div")
        hourLabel.className = "timeline-hour-label"
        hourLabel.textContent = hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`
  
        const hourContent = document.createElement("div")
        hourContent.className = "timeline-hour-content"
  
        // Find tasks for this hour
        const hourTasks = tasks.filter((task) => {
          const taskHour = Number.parseInt(task.time.split(":")[0])
          return taskHour === hour
        })
  
        // Add tasks to this hour
        hourTasks.forEach((task) => {
          const taskElement = document.createElement("div")
          taskElement.className = `timeline-task priority-${task.priority.toLowerCase()}`
          if (task.completed) {
            taskElement.classList.add("completed")
          }
  
          taskElement.innerHTML = `
            <div class="timeline-task-title">${task.title}</div>
            <div class="timeline-task-time">${task.time}</div>
          `
  
          taskElement.addEventListener("click", () => {
            this.showTaskDetails(task.id)
          })
  
          hourContent.appendChild(taskElement)
        })
  
        timeBlock.appendChild(hourLabel)
        timeBlock.appendChild(hourContent)
        dailyTimeline.appendChild(timeBlock)
      }
    }
  
    // Get the start date of the week (Sunday)
    getStartOfWeek(date) {
      const result = new Date(date)
      const day = result.getDay()
      result.setDate(result.getDate() - day)
      return result
    }
  
    // Render the weekly view
    renderWeeklyView() {
      const weeklyCalendar = document.getElementById("weekly-calendar")
      weeklyCalendar.innerHTML = ""
  
      // Update week display
      const endOfWeek = new Date(this.weekStartDate)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
  
      const options = { month: "short", day: "numeric" }
      const weekDisplay = `${this.weekStartDate.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`
      document.getElementById("current-week").textContent = weekDisplay
  
      // Create week days header
      const weekDays = document.createElement("div")
      weekDays.className = "week-days"
  
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      dayNames.forEach((day, index) => {
        const dayElement = document.createElement("div")
        dayElement.className = "week-day"
        dayElement.textContent = day
  
        // Highlight today
        const currentDate = new Date(this.weekStartDate)
        currentDate.setDate(currentDate.getDate() + index)
  
        if (this.isToday(currentDate)) {
          dayElement.classList.add("today")
        }
  
        weekDays.appendChild(dayElement)
      })
  
      weeklyCalendar.appendChild(weekDays)
  
      // Create week grid
      const weekGrid = document.createElement("div")
      weekGrid.className = "week-grid"
  
      // Get tasks for this week
      const weekTasks = this.taskManager.getTasksForWeek(this.weekStartDate)
  
      // Create day cells
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(this.weekStartDate)
        currentDate.setDate(currentDate.getDate() + i)
  
        const dayCell = document.createElement("div")
        dayCell.className = "day-cell"
  
        if (this.isToday(currentDate)) {
          dayCell.classList.add("today")
        }
  
        const dateString = currentDate.toISOString().split("T")[0]
  
        // Day number
        const dayNumber = document.createElement("div")
        dayNumber.className = "day-number"
        dayNumber.textContent = currentDate.getDate()
        dayCell.appendChild(dayNumber)
  
        // Day tasks
        const dayTasks = document.createElement("div")
        dayTasks.className = "day-tasks"
  
        // Filter tasks for this day
        const tasksForDay = weekTasks.filter((task) => task.date === dateString)
  
        tasksForDay.forEach((task) => {
          const taskElement = document.createElement("div")
          taskElement.className = `day-task priority-${task.priority.toLowerCase()}`
          if (task.completed) {
            taskElement.classList.add("completed")
          }
  
          taskElement.textContent = task.title
  
          taskElement.addEventListener("click", () => {
            this.showTaskDetails(task.id)
          })
  
          dayTasks.appendChild(taskElement)
        })
  
        dayCell.appendChild(dayTasks)
        weekGrid.appendChild(dayCell)
      }
  
      weeklyCalendar.appendChild(weekGrid)
    }
  
    // Check if a date is today
    isToday(date) {
      const today = new Date()
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      )
    }
  
    // Clear all filters
    clearFilters() {
      document.getElementById("sort-by").value = "date"
      document.getElementById("filter-category").value = "all"
      document.getElementById("filter-date").value = ""
      this.renderDashboard()
    }
  }
  
  // Initialize the application
  document.addEventListener("DOMContentLoaded", () => {
    // Create task manager
    const taskManager = new TaskManager()
  
    // Create UI manager
    const uiManager = new UIManager(taskManager)
  
    // Load theme preference
    const savedTheme = localStorage.getItem("taskflow-theme")
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode")
      document.getElementById("theme-toggle").innerHTML = '<i class="bi bi-sun-fill"></i> Light Mode'
    }
  })
  
  