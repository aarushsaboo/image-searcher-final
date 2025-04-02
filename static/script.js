document.addEventListener("DOMContentLoaded", function () {
  // Initialize particles.js
  particlesJS("particles-js", {
    particles: {
      number: {
        value: 80,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: "#ffffff",
      },
      shape: {
        type: "circle",
        stroke: {
          width: 0,
          color: "#000000",
        },
        polygon: {
          nb_sides: 5,
        },
      },
      opacity: {
        value: 0.5,
        random: false,
        anim: {
          enable: false,
          speed: 1,
          opacity_min: 0.1,
          sync: false,
        },
      },
      size: {
        value: 3,
        random: true,
        anim: {
          enable: false,
          speed: 40,
          size_min: 0.1,
          sync: false,
        },
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200,
        },
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: true,
          mode: "grab",
        },
        onclick: {
          enable: true,
          mode: "push",
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 140,
          line_linked: {
            opacity: 1,
          },
        },
        bubble: {
          distance: 400,
          size: 40,
          duration: 2,
          opacity: 8,
          speed: 3,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
        push: {
          particles_nb: 4,
        },
        remove: {
          particles_nb: 2,
        },
      },
    },
    retina_detect: true,
  })

  const searchInput = document.getElementById("searchInput")
  const searchButton = document.getElementById("searchButton")
  const imageGrid = document.getElementById("imageGrid")
  const loadingSpinner = document.getElementById("loadingSpinner")
  const noResults = document.getElementById("noResults")

  // Create toast container
  const toastContainer = document.createElement("div")
  toastContainer.className = "toast-container"
  document.body.appendChild(toastContainer)

  function showToast(message, type = "success") {
    const toast = document.createElement("div")
    toast.className = `toast show bg-${type} text-white`
    toast.innerHTML = `
      <div class="toast-body d-flex align-items-center">
        <i class="fas ${
          type === "success"
            ? "fa-check-circle"
            : type === "danger"
            ? "fa-exclamation-circle"
            : "fa-exclamation-triangle"
        } me-2"></i>
        ${message}
      </div>
    `
    toastContainer.appendChild(toast)
    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  function createImageCard(imageUrl, index, query) {
    const col = document.createElement("div")
    col.className = "col-md-4 col-sm-6"

    col.innerHTML = `
            <div class="image-card">
                <img src="${imageUrl}" alt="Search result ${
      index + 1
    }" class="img-fluid">
                <button class="btn btn-primary btn-sm download-btn" 
                        onclick="downloadImage('${imageUrl}', '${query}')">
                    <i class="fas fa-download me-1"></i> Download
                </button>
            </div>
        `

    return col
  }

  async function searchImages(query) {
    try {
      loadingSpinner.classList.remove("d-none")
      imageGrid.innerHTML = ""
      noResults.classList.add("d-none")

      const formData = new FormData()
      formData.append("query", query)

      const response = await fetch("/search", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.images.length === 0) {
        noResults.classList.remove("d-none")
        return
      }

      // Add a small delay between adding each image for a staggered effect
      for (let i = 0; i < data.images.length; i++) {
        setTimeout(() => {
          const imageCard = createImageCard(data.images[i], i, query)
          imageGrid.appendChild(imageCard)

          // Add a fade-in animation
          imageCard.style.opacity = "0"
          imageCard.style.transform = "translateY(20px)"
          setTimeout(() => {
            imageCard.style.transition =
              "opacity 0.5s ease, transform 0.5s ease"
            imageCard.style.opacity = "1"
            imageCard.style.transform = "translateY(0)"
          }, 50)
        }, i * 100) // 100ms delay between each image
      }
    } catch (error) {
      showToast(error.message, "danger")
    } finally {
      loadingSpinner.classList.add("d-none")
    }
  }

  async function downloadImage(url, query) {
    try {
      const formData = new FormData()
      formData.append("url", url)
      formData.append("query", query)

      const response = await fetch("/download", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Download failed")
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `${query.replace(" ", "_")}.jpg`

      // Create a blob from the response
      const blob = await response.blob()

      // Create a download link and trigger it
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      showToast(`Image downloaded as ${filename}`)
    } catch (error) {
      showToast(error.message, "danger")
    }
  }

  // Event listeners
  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim()
    if (query) {
      searchImages(query)
    } else {
      showToast("Please enter a search term", "warning")
    }
  })

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim()
      if (query) {
        searchImages(query)
      } else {
        showToast("Please enter a search term", "warning")
      }
    }
  })

  // Add focus effect to search input
  searchInput.addEventListener("focus", () => {
    searchInput.parentElement.classList.add("focused")
  })

  searchInput.addEventListener("blur", () => {
    searchInput.parentElement.classList.remove("focused")
  })

  // Make downloadImage function available globally
  window.downloadImage = downloadImage
})
