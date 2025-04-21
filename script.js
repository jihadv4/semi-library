document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const searchInput = document.getElementById("searchInput")
  const searchButton = document.getElementById("searchButton")
  const yearFilter = document.getElementById("yearFilter")
  const semesterFilter = document.getElementById("semesterFilter")
  const courseFilter = document.getElementById("courseFilter")
  const resetFiltersButton = document.getElementById("resetFilters")
  const booksGrid = document.getElementById("booksGrid")
  const resultCount = document.getElementById("resultCount")
  const noResults = document.getElementById("noResults")
  const clearSearchButton = document.getElementById("clearSearch")

  // Store all books data
  let allBooks = []
  let filteredBooks = []
  const coursesBySemester = {}
  const allCourses = []

  // Load CSV data
  function loadBooksData() {
    Papa.parse("books.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Process the data to handle multiple courses
        allBooks = results.data.map((book) => {
          // Process course titles and codes
          const courseTitles = book["Course Title"].split("|")
          const courseCodes = book["Course Code"].split("|")

          // Create an array of course objects
          const courses = courseTitles.map((title, index) => {
            return {
              title: title.trim(),
              code: courseCodes[index] ? courseCodes[index].trim() : "",
            }
          })

          // Organize courses by year and semester for filtering
          const yearSemKey = `${book.Year}-${book.Semester}`
          if (!coursesBySemester[yearSemKey]) {
            coursesBySemester[yearSemKey] = []
          }

          courses.forEach((course) => {
            if (!coursesBySemester[yearSemKey].some((c) => c.code === course.code)) {
              coursesBySemester[yearSemKey].push(course)
            }
          })

          // Add to all courses list
          courses.forEach((course) => {
            if (!allCourses.some((c) => c.code === course.code)) {
              allCourses.push(course)
            }
          })

          return {
            ...book,
            courses: courses,
          }
        })

        // Sort all courses by code
        allCourses.sort((a, b) => a.code.localeCompare(b.code))

        // Populate course filter dropdown
        populateCourseFilter(allCourses)

        filteredBooks = [...allBooks]
        displayBooks(filteredBooks)
        updateResultCount()
      },
      error: (error) => {
        console.error("Error loading CSV:", error)
        booksGrid.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error loading book data. Please try again later.</p>
          </div>
        `
      },
    })
  }

  // Populate course filter dropdown
  function populateCourseFilter(courses) {
    const courseSelect = document.getElementById("courseFilter")

    // Clear existing options except the first one
    while (courseSelect.options.length > 1) {
      courseSelect.remove(1)
    }

    // Add options to select
    courses.forEach((course) => {
      const option = document.createElement("option")
      option.value = `${course.code}|${course.title}`
      option.textContent = `${course.code} - ${course.title}`
      courseSelect.appendChild(option)
    })
  }

  // Update course filter based on year and semester selection
  function updateCourseFilter() {
    const yearValue = yearFilter.value
    const semesterValue = semesterFilter.value

    if (yearValue && semesterValue) {
      const yearSemKey = `${yearValue}-${semesterValue}`
      const semesterCourses = coursesBySemester[yearSemKey] || []
      populateCourseFilter(semesterCourses)
    } else {
      populateCourseFilter(allCourses)
    }
  }

  // Display books in the grid
  function displayBooks(books) {
    booksGrid.innerHTML = ""

    if (books.length === 0) {
      noResults.classList.remove("hidden")
      booksGrid.classList.add("hidden")
      return
    }

    noResults.classList.add("hidden")
    booksGrid.classList.remove("hidden")

    books.forEach((book) => {
      const card = document.createElement("div")
      card.className = "book-card"

      // Create course info HTML
      const courseInfoHTML = createCourseInfoHTML(book.courses)

      // Determine if download link is available
      const hasDownloadLink = book["Download Link"] && book["Download Link"].trim() !== ""
      const downloadBtnHTML = hasDownloadLink
        ? `<a href="${book["Download Link"]}" target="_blank" class="download-btn">
             <i class="fas fa-download"></i> Download PDF
           </a>`
        : ""

      card.innerHTML = `
        <div class="book-header">
          <h3 class="book-title">${book.Title}</h3>
          <div class="book-author">
            <i class="fas fa-user"></i> ${book.Author}
          </div>
        </div>
        <div class="book-content">
          <div class="book-info">
            <div class="info-row">
              <div class="info-label">Year:</div>
              <div class="info-value">${book.Year}${getOrdinal(book.Year)} Year</div>
            </div>
            <div class="info-row">
              <div class="info-label">Semester:</div>
              <div class="info-value">${book.Semester}${getOrdinal(book.Semester)} Semester</div>
            </div>
          </div>
          
          <div class="location-info">
            <div class="location-title">
              <i class="fas fa-map-marker-alt"></i> Location
            </div>
            <div class="location-details">
              <div class="location-item">
                <span class="location-label">Shelf:</span>
                <span class="location-value">${book.Shelf}</span>
              </div>
              <div class="location-item">
                <span class="location-label">Row:</span>
                <span class="location-value">${book.Row}</span>
              </div>
            </div>
          </div>
          
          <div class="course-info">
            <div class="course-title">
              <i class="fas fa-graduation-cap"></i> Associated Courses
            </div>
            <div class="course-list">
              ${courseInfoHTML}
            </div>
          </div>
          
          <div class="book-actions">
            ${downloadBtnHTML}
          </div>
        </div>
      `

      booksGrid.appendChild(card)
    })
  }

  // Create HTML for course information
  function createCourseInfoHTML(courses) {
    if (!courses || courses.length === 0) return "<p>No course information available</p>"

    return courses
      .map((course) => {
        return `
          <div class="course-item">
            <div class="course-name">${course.title}</div>
            <div class="course-code">${course.code}</div>
          </div>
        `
      })
      .join("")
  }

  // Get ordinal suffix for numbers
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"]
    const v = n % 100
    return s[(v - 20) % 10] || s[v] || s[0]
  }

  // Filter books based on search and filters
  function filterBooks() {
    const searchTerm = searchInput.value.toLowerCase()
    const yearValue = yearFilter.value
    const semesterValue = semesterFilter.value
    const courseValue = courseFilter.value

    // Parse course filter value
    let selectedCourseCode = ""
    let selectedCourseTitle = ""

    if (courseValue) {
      const [code, title] = courseValue.split("|")
      selectedCourseCode = code
      selectedCourseTitle = title
    }

    filteredBooks = allBooks.filter((book) => {
      // Search term filter
      const matchesSearch =
        searchTerm === "" ||
        book.Title.toLowerCase().includes(searchTerm) ||
        book.Author.toLowerCase().includes(searchTerm) ||
        book.courses.some(
          (course) => course.title.toLowerCase().includes(searchTerm) || course.code.toLowerCase().includes(searchTerm),
        ) ||
        book.Shelf.toLowerCase().includes(searchTerm) ||
        book.Row.toLowerCase().includes(searchTerm)

      // Year filter
      const matchesYear = yearValue === "" || book.Year === yearValue

      // Semester filter
      const matchesSemester = semesterValue === "" || book.Semester === semesterValue

      // Course filter
      const matchesCourse = courseValue === "" || book.courses.some((course) => course.code === selectedCourseCode)

      return matchesSearch && matchesYear && matchesSemester && matchesCourse
    })

    displayBooks(filteredBooks)
    updateResultCount()
  }

  // Update the result count text
  function updateResultCount() {
    if (filteredBooks.length === allBooks.length) {
      resultCount.textContent = `Showing all ${allBooks.length} books`
    } else {
      resultCount.textContent = `Showing ${filteredBooks.length} of ${allBooks.length} books`
    }
  }

  // Reset all filters
  function resetFilters() {
    searchInput.value = ""
    yearFilter.value = ""
    semesterFilter.value = ""
    courseFilter.value = ""

    // Reset course filter to show all courses
    populateCourseFilter(allCourses)

    filteredBooks = [...allBooks]
    displayBooks(filteredBooks)
    updateResultCount()
  }

  // Event listeners
  searchButton.addEventListener("click", filterBooks)
  searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      filterBooks()
    }
  })

  yearFilter.addEventListener("change", () => {
    updateCourseFilter()
    filterBooks()
  })

  semesterFilter.addEventListener("change", () => {
    updateCourseFilter()
    filterBooks()
  })

  courseFilter.addEventListener("change", filterBooks)
  resetFiltersButton.addEventListener("click", resetFilters)
  clearSearchButton.addEventListener("click", resetFilters)

  // Initial load
  // Check if Papa is defined, if not, load it dynamically
  if (typeof Papa === "undefined") {
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"
    script.onload = loadBooksData // Call loadBooksData after Papa is loaded
    script.onerror = () => {
      console.error("Failed to load PapaParse library.")
      booksGrid.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load required library. Please check your internet connection and try again.</p>
        </div>
      `
    }
    document.head.appendChild(script)
  } else {
    loadBooksData() // If Papa is already defined, load the data immediately
  }
})
