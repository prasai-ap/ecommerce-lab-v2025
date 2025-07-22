// Theme Management
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem("theme") || "light"
    this.init()
  }

  init() {
    this.applyTheme()
    this.bindEvents()
    this.updateCartCount()
  }

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.theme)
    const themeIcon = document.getElementById("themeIcon")
    if (themeIcon) {
      themeIcon.className = this.theme === "dark" ? "fas fa-sun" : "fas fa-moon"
    }
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light"
    localStorage.setItem("theme", this.theme)
    this.applyTheme()
  }

  bindEvents() {
    const themeToggle = document.getElementById("themeToggle")
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme())
    }
  }

  updateCartCount() {
    const cartCount = this.getCartItemCount()
    const cartCountElement = document.getElementById("cartCount")
    if (cartCountElement) {
      cartCountElement.textContent = cartCount
      cartCountElement.style.display = cartCount > 0 ? "inline" : "none"
      // Update currency symbol
      cartCountElement.setAttribute("data-currency", "₹")
    }
  }

  getCartItemCount() {
    // This would typically make an AJAX call to get cart count
    // For now, we'll use localStorage as a fallback
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    return cart.reduce((total, item) => total + item.quantity, 0)
  }
}

// Cart Management
class CartManager {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("cart") || "[]")
    this.init()
  }

  init() {
    this.bindEvents()
    this.updateCartDisplay()
  }

  bindEvents() {
    // Add to cart forms
    const addToCartForms = document.querySelectorAll(".add-to-cart-form")
    addToCartForms.forEach((form) => {
      form.addEventListener("submit", (e) => this.handleAddToCart(e))
    })

    // Size selection
    const sizeOptions = document.querySelectorAll(".size-option")
    sizeOptions.forEach((option) => {
      option.addEventListener("click", (e) => this.handleSizeSelection(e))
    })

    // Quantity changes
    const quantityInputs = document.querySelectorAll('input[name="quantity"], select[name="quantity"]')
    quantityInputs.forEach((input) => {
      input.addEventListener("change", () => this.updateCartDisplay())
    })
  }

  handleSizeSelection(e) {
    e.preventDefault()
    const sizeOptions = document.querySelectorAll(".size-option")
    sizeOptions.forEach((option) => option.classList.remove("active"))

    e.target.classList.add("active")
    const selectedSizeInput = document.getElementById("selectedSize")
    if (selectedSizeInput) {
      selectedSizeInput.value = e.target.dataset.size
    }
  }

  async handleAddToCart(e) {
    e.preventDefault()
    const form = e.target
    const formData = new FormData(form)

    // Validate size selection
    if (!formData.get("size")) {
      this.showNotification("Please select a size", "error")
      return
    }

    try {
      const response = await fetch("/add_to_cart", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        this.showNotification("Item added to cart!", "success")
        this.updateCartCount()

        // Add item to local storage for immediate UI update
        const item = {
          id: Number.parseInt(formData.get("product_id")),
          size: formData.get("size"),
          quantity: Number.parseInt(formData.get("quantity") || 1),
        }
        this.addToLocalCart(item)
      } else {
        this.showNotification(result.message || "Error adding item to cart", "error")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      this.showNotification("Error adding item to cart", "error")
    }
  }

  addToLocalCart(item) {
    const existingItem = this.cart.find((cartItem) => cartItem.id === item.id && cartItem.size === item.size)

    if (existingItem) {
      existingItem.quantity += item.quantity
    } else {
      this.cart.push(item)
    }

    localStorage.setItem("cart", JSON.stringify(this.cart))
    this.updateCartDisplay()
  }

  updateCartCount() {
    const cartCount = this.cart.reduce((total, item) => total + item.quantity, 0)
    const cartCountElement = document.getElementById("cartCount")
    if (cartCountElement) {
      cartCountElement.textContent = cartCount
      cartCountElement.style.display = cartCount > 0 ? "inline" : "none"
    }
  }

  updateCartDisplay() {
    this.updateCartCount()
    // Update any cart-specific displays if on cart page
    if (window.location.pathname === "/cart") {
      // Refresh cart page content if needed
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `alert alert-${type === "error" ? "danger" : "success"} notification`
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
        border-radius: 15px;
        box-shadow: 0 4px 20px var(--shadow);
    `
    notification.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${message}</span>
            <button class="close" style="background: none; border: none; font-size: 1.5rem; line-height: 1; color: inherit; opacity: 0.7;">&times;</button>
        </div>
    `

    const closeBtn = notification.querySelector(".close")
    closeBtn.addEventListener("click", () => notification.remove())

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOut 0.3s ease-out"
        setTimeout(() => notification.remove(), 300)
      }
    }, 4000)
  }
}

// Product Image Gallery
class ProductGallery {
  constructor() {
    this.init()
  }

  init() {
    this.bindEvents()
  }

  bindEvents() {
    // Handle product image hover effects
    const productImages = document.querySelectorAll(".product-image img")
    productImages.forEach((img) => {
      img.addEventListener("error", (e) => {
        // Fallback for broken images
        e.target.src = "{{ url_for('static', filename='placeholder.svg') }}"
      })
    })
  }
}

// Form Validation
class FormValidator {
  constructor() {
    this.init()
  }

  init() {
    this.bindEvents()
  }

  bindEvents() {
    // Checkout form validation
    const checkoutForm = document.querySelector(".checkout-form")
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => this.validateCheckoutForm(e))
    }

    // Contact form validation
    const contactForm = document.querySelector(".contact-form")
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => this.validateContactForm(e))
    }

    // Real-time validation
    const inputs = document.querySelectorAll("input[required], textarea[required]")
    inputs.forEach((input) => {
      input.addEventListener("blur", (e) => this.validateField(e.target))
      input.addEventListener("input", (e) => this.clearFieldError(e.target))
    })
  }

  validateCheckoutForm(e) {
    const form = e.target
    const requiredFields = form.querySelectorAll("[required]")
    let isValid = true

    requiredFields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false
      }
    })

    // Validate card number format
    const cardNumber = form.querySelector("#cardNumber")
    if (cardNumber && !this.validateCardNumber(cardNumber.value)) {
      this.showFieldError(cardNumber, "Please enter a valid card number")
      isValid = false
    }

    // Validate expiry date
    const expiry = form.querySelector("#expiry")
    if (expiry && !this.validateExpiryDate(expiry.value)) {
      this.showFieldError(expiry, "Please enter a valid expiry date (MM/YY)")
      isValid = false
    }

    if (!isValid) {
      e.preventDefault()
    }
  }

  validateContactForm(e) {
    e.preventDefault()
    const form = e.target
    const requiredFields = form.querySelectorAll("[required]")
    let isValid = true

    requiredFields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false
      }
    })

    if (isValid) {
      // Simulate form submission
      const notification = new CartManager()
      notification.showNotification("Message sent successfully!", "success")
      form.reset()
    }
  }

  validateField(field) {
    const value = field.value.trim()

    if (field.hasAttribute("required") && !value) {
      this.showFieldError(field, "This field is required")
      return false
    }

    if (field.type === "email" && value && !this.validateEmail(value)) {
      this.showFieldError(field, "Please enter a valid email address")
      return false
    }

    if (field.type === "tel" && value && !this.validatePhone(value)) {
      this.showFieldError(field, "Please enter a valid phone number")
      return false
    }

    this.clearFieldError(field)
    return true
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  validatePhone(phone) {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
  }

  validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, "")
    return /^\d{13,19}$/.test(cleanNumber)
  }

  validateExpiryDate(expiry) {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
    if (!expiryRegex.test(expiry)) return false

    const [month, year] = expiry.split("/")
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1

    const expiryYear = Number.parseInt(year)
    const expiryMonth = Number.parseInt(month)

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return false
    }

    return true
  }

  showFieldError(field, message) {
    this.clearFieldError(field)

    field.classList.add("is-invalid")
    const errorDiv = document.createElement("div")
    errorDiv.className = "invalid-feedback"
    errorDiv.textContent = message
    field.parentNode.appendChild(errorDiv)
  }

  clearFieldError(field) {
    field.classList.remove("is-invalid")
    const errorDiv = field.parentNode.querySelector(".invalid-feedback")
    if (errorDiv) {
      errorDiv.remove()
    }
  }
}

// Smooth Animations
class AnimationManager {
  constructor() {
    this.init()
  }

  init() {
    this.observeElements()
    this.bindScrollEvents()
  }

  observeElements() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animation = "fadeIn 0.6s ease-out forwards"
        }
      })
    }, observerOptions)

    // Observe product cards and other animated elements
    const animatedElements = document.querySelectorAll(".product-card, .brand-card, .feature-icon")
    animatedElements.forEach((el) => {
      el.style.opacity = "0"
      observer.observe(el)
    })
  }

  bindScrollEvents() {
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]')
    anchorLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const target = document.querySelector(link.getAttribute("href"))
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      })
    })
  }
}

// Add WishlistManager class
class WishlistManager {
  constructor() {
    this.wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
    this.init()
  }

  init() {
    this.addWishlistButtons()
    this.bindEvents()
  }

  addWishlistButtons() {
    const productCards = document.querySelectorAll(".product-card .product-image")
    productCards.forEach((card) => {
      if (!card.querySelector(".wishlist-btn")) {
        const wishlistBtn = document.createElement("button")
        wishlistBtn.className = "wishlist-btn"
        wishlistBtn.innerHTML = '<i class="far fa-heart"></i>'
        wishlistBtn.setAttribute(
          "data-product",
          JSON.stringify({
            id: Math.random(), // This should be the actual product ID
            name: "Product Name",
            price: 0,
            brand: "Brand",
          }),
        )
        card.style.position = "relative"
        card.appendChild(wishlistBtn)
      }
    })
  }

  bindEvents() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".wishlist-btn")) {
        const btn = e.target.closest(".wishlist-btn")
        const productData = JSON.parse(btn.dataset.product)
        this.toggleWishlist(productData, btn)
      }
    })
  }

  toggleWishlist(product, btn) {
    const existingIndex = this.wishlist.findIndex((item) => item.id === product.id)

    if (existingIndex > -1) {
      this.wishlist.splice(existingIndex, 1)
      btn.innerHTML = '<i class="far fa-heart"></i>'
      btn.classList.remove("active")
    } else {
      this.wishlist.push(product)
      btn.innerHTML = '<i class="fas fa-heart"></i>'
      btn.classList.add("active")
    }

    localStorage.setItem("wishlist", JSON.stringify(this.wishlist))
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all managers
  const themeManager = new ThemeManager()
  const cartManager = new CartManager()
  const productGallery = new ProductGallery()
  const formValidator = new FormValidator()
  const animationManager = new AnimationManager()
  const wishlistManager = new WishlistManager()

  console.log("SoleStyle eCommerce initialized successfully with Indian Rupees!")

  // Add CSS animations
  const style = document.createElement("style")
  style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification {
            animation: slideIn 0.3s ease-out;
        }
        
        .is-invalid {
            border-color: #dc3545 !important;
        }
        
        .invalid-feedback {
            display: block;
            width: 100%;
            margin-top: 0.25rem;
            font-size: 0.875em;
            color: #dc3545;
        }
    `
  document.head.appendChild(style)

  // Global utility functions
  window.updateCartCount = () => {
    themeManager.updateCartCount()
  }

  console.log("SoleStyle eCommerce initialized successfully!")
})

// Export for potential module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ThemeManager,
    CartManager,
    ProductGallery,
    FormValidator,
    AnimationManager,
  }
}
