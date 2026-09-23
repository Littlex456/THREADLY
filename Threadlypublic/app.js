// =========================================
// THREADLY AUTHENTICATION SYSTEM
// =========================================

(function () {

    const LOGIN_PAGE =
        "login.html";

    const SIGNUP_PAGE =
        "signup.html";


    // =========================================
    // PROTECTED PAGES
    // =========================================

    const protectedPages = [

        "cart.html",

        "checkout.html",

        "account.html",

        "orders.html",

        "saved.html",

        "settings.html",

        "payment-method.html",

        "transfer.html",

        "receipt.html",

        "order-details.html"

    ];


    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    // =========================================
    // LOAD A SCRIPT
    // =========================================

    function loadScript(src) {

        return new Promise(
            function (resolve, reject) {

                const existingScript =
                    document.querySelector(
                        `script[src="${src}"]`
                    );

                if (existingScript) {

                    // Give an already-loaded script
                    // a moment to finish before continuing.

                    if (
                        existingScript.dataset.loaded ===
                        "true"
                    ) {

                        resolve();

                        return;

                    }

                    existingScript.addEventListener(
                        "load",
                        resolve,
                        {
                            once: true
                        }
                    );

                    existingScript.addEventListener(
                        "error",
                        reject,
                        {
                            once: true
                        }
                    );

                    return;
                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    src;


                script.dataset.loaded =
                    "false";


                script.addEventListener(
                    "load",
                    function () {

                        script.dataset.loaded =
                            "true";

                        resolve();

                    },
                    {
                        once: true
                    }
                );


                script.addEventListener(
                    "error",
                    function () {

                        reject(
                            new Error(
                                "Failed to load " +
                                src
                            )
                        );

                    },
                    {
                        once: true
                    }
                );


                document.head.appendChild(
                    script
                );

            }
        );

    }


    // =========================================
    // MAKE SURE SUPABASE IS AVAILABLE
    // =========================================

    async function getSupabaseClient() {

        // Already available
        if (
            window.threadlySupabase
        ) {

            return window.threadlySupabase;

        }


        // Load the Supabase library
        if (
            !window.supabase
        ) {

            await loadScript(
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
            );

        }


        // Load THREADLY Supabase configuration
        if (
            !window.threadlySupabase
        ) {

            await loadScript(
                "supabase-client.js"
            );

        }


        if (
            !window.threadlySupabase
        ) {

            throw new Error(
                "THREADLY Supabase client could not be created."
            );

        }


        return window.threadlySupabase;

    }


    // =========================================
    // AUTHENTICATION INITIALIZATION
    // =========================================

    let supabase =
        null;

    let currentUser =
        null;


    const authReady =
        (async function () {

            try {

                supabase =
                    await getSupabaseClient();


                const {
                    data,
                    error
                } =
                    await supabase.auth.getUser();


                if (error) {

                    console.error(
                        "THREADLY authentication check failed:",
                        error
                    );

                    currentUser =
                        null;

                    return null;

                }


                currentUser =
                    data.user || null;


                return currentUser;

            } catch (error) {

                console.error(
                    "THREADLY authentication initialization failed:",
                    error
                );

                currentUser =
                    null;

                return null;

            }

        })();


    // =========================================
    // KEEP AUTH STATE UPDATED
    // =========================================

    authReady.then(
        function () {

            if (!supabase) {

                return;

            }


            supabase.auth.onAuthStateChange(
                function (
                    event,
                    session
                ) {

                    currentUser =
                        session?.user || null;


                    // Compatibility only.
                    // This is NOT used to grant access.

                    if (currentUser) {

                        localStorage.setItem(
                            "threadlyLoggedIn",
                            "true"
                        );

                    } else {

                        localStorage.removeItem(
                            "threadlyLoggedIn"
                        );

                    }

                }
            );

        }
    );


    // =========================================
    // CHECK LOGIN STATUS
    // =========================================

    async function isLoggedIn() {

        await authReady;

        return !!currentUser;

    }


    // =========================================
    // PROTECT PAGE ACCESS
    // =========================================

    async function protectPage() {

        if (
            !protectedPages.includes(
                currentPage
            )
        ) {

            return;

        }


        const loggedIn =
            await isLoggedIn();


        if (!loggedIn) {

            const requestedPage =
                currentPage +
                window.location.search;


            window.location.replace(

                LOGIN_PAGE +
                "?redirect=" +
                encodeURIComponent(
                    requestedPage
                )

            );


            return;

        }


        window.history.replaceState(
            null,
            "",
            window.location.href
        );

    }


    protectPage();


    // =========================================
    // PROTECT BROWSER BACK/FORWARD
    // =========================================

    window.addEventListener(
        "pageshow",
        async function (event) {

            if (
                !event.persisted &&
                performance.getEntriesByType(
                    "navigation"
                )[0]?.type !==
                "back_forward"
            ) {

                return;

            }


            if (
                !protectedPages.includes(
                    currentPage
                )
            ) {

                return;

            }


            const loggedIn =
                await isLoggedIn();


            if (!loggedIn) {

                window.location.replace(
                    LOGIN_PAGE
                );

            }

        }
    );


    // =========================================
    // PROTECT CUSTOMER LINKS
    // =========================================

    document.addEventListener(
        "click",
        async function (event) {

            const link =
                event.target.closest("a");


            if (!link) {

                return;

            }


            const href =
                link.getAttribute("href");


            if (!href) {

                return;

            }


            if (
                href.startsWith("#") ||
                href.startsWith("http") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("javascript:")
            ) {

                return;

            }


            let targetPage =
                "";


            try {

                const url =
                    new URL(
                        href,
                        window.location.href
                    );


                targetPage =
                    url.pathname
                        .split("/")
                        .pop()
                        .toLowerCase();

            } catch (error) {

                return;

            }


            if (
                !protectedPages.includes(
                    targetPage
                )
            ) {

                return;

            }


            const loggedIn =
                await isLoggedIn();


            if (loggedIn) {

                return;

            }


            event.preventDefault();


            const requestedPage =
                targetPage +
                (
                    href.includes("?")
                        ? href.substring(
                            href.indexOf("?")
                        )
                        : ""
                );


            if (
                currentPage ===
                LOGIN_PAGE
            ) {

                return;

            }


            window.location.replace(

                LOGIN_PAGE +
                "?redirect=" +
                encodeURIComponent(
                    requestedPage
                )

            );

        }
    );


    // =========================================
    // PREVENT CACHED PROTECTED PAGES
    // =========================================

    if (
        protectedPages.includes(
            currentPage
        )
    ) {

        const metaCache =
            document.createElement(
                "meta"
            );


        metaCache.httpEquiv =
            "Cache-Control";


        metaCache.content =
            "no-store, no-cache, must-revalidate, max-age=0";


        document.head.appendChild(
            metaCache
        );


        const metaPragma =
            document.createElement(
                "meta"
            );


        metaPragma.httpEquiv =
            "Pragma";


        metaPragma.content =
            "no-cache";


        document.head.appendChild(
            metaPragma
        );


        const metaExpires =
            document.createElement(
                "meta"
            );


        metaExpires.httpEquiv =
            "Expires";


        metaExpires.content =
            "0";


        document.head.appendChild(
            metaExpires
        );

    }


    // =========================================
    // MAKE AUTH FUNCTIONS AVAILABLE
    // =========================================

    window.threadlyIsLoggedIn =
        isLoggedIn;


    window.threadlyRequireLogin =
        async function () {

            const loggedIn =
                await isLoggedIn();


            if (loggedIn) {

                return true;

            }


            const requestedPage =
                currentPage +
                window.location.search;


            window.location.replace(

                LOGIN_PAGE +
                "?redirect=" +
                encodeURIComponent(
                    requestedPage
                )

            );


            return false;

        };


    // =========================================
    // SUPABASE CLIENT ACCESS
    // =========================================

    window.threadlyGetSupabase =
        async function () {

            await authReady;

            return supabase;

        };

})();

// =========================================
// THEME SYSTEM
// =========================================

(function () {

    const THEME_KEY = "threadlyTheme";


    // -----------------------------------------
    // GET SYSTEM THEME
    // -----------------------------------------

    function getSystemTheme() {

        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            return "dark";
        }

        return "light";
    }


    // -----------------------------------------
    // GET SAVED THEME
    // -----------------------------------------

    function getSavedTheme() {

        const savedTheme =
            localStorage.getItem(THEME_KEY);

        if (
            savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system"
        ) {
            return savedTheme;
        }

        return "system";
    }


    // -----------------------------------------
    // UPDATE THEME CONTROLS
    // -----------------------------------------

    function updateThemeControls(selectedTheme) {

        const themeButtons =
            document.querySelectorAll("[data-theme]");


        themeButtons.forEach(function (button) {

            const buttonTheme =
                button.dataset.theme;

            button.classList.toggle(
                "active",
                buttonTheme === selectedTheme
            );


            const check =
                button.querySelector(
                    ".theme-option-check"
                );


            if (check) {

                check.style.opacity =
                    buttonTheme === selectedTheme
                        ? "1"
                        : "0";

            }

        });


        const lightThemeButton =
            document.getElementById("themeLight");

        const darkThemeButton =
            document.getElementById("themeDark");

        const systemThemeButton =
            document.getElementById("themeSystem");


        if (lightThemeButton) {

            lightThemeButton.classList.toggle(
                "active",
                selectedTheme === "light"
            );

        }


        if (darkThemeButton) {

            darkThemeButton.classList.toggle(
                "active",
                selectedTheme === "dark"
            );

        }


        if (systemThemeButton) {

            systemThemeButton.classList.toggle(
                "active",
                selectedTheme === "system"
            );

        }

    }


    // -----------------------------------------
    // APPLY THEME
    // -----------------------------------------

    function applyTheme(theme) {

        let selectedTheme = theme;


        if (
            selectedTheme !== "light" &&
            selectedTheme !== "dark" &&
            selectedTheme !== "system"
        ) {
            selectedTheme = "system";
        }


        const actualTheme =
            selectedTheme === "system"
                ? getSystemTheme()
                : selectedTheme;


        // Keep both THREADLY theme classes
        // working with the existing CSS.

        if (actualTheme === "dark") {

            document.documentElement.classList.add(
                "threadly-dark"
            );

            if (document.body) {

                document.body.classList.add(
                    "dark-mode"
                );

            }

        } else {

            document.documentElement.classList.remove(
                "threadly-dark"
            );

            if (document.body) {

                document.body.classList.remove(
                    "dark-mode"
                );

            }

        }


        // Save selected theme

        localStorage.setItem(
            THEME_KEY,
            selectedTheme
        );


        // Update settings controls

        updateThemeControls(
            selectedTheme
        );

    }


    // -----------------------------------------
    // GLOBAL THREADLY THEME FUNCTIONS
    // -----------------------------------------

    window.threadlyApplyTheme =
        function (theme) {

            applyTheme(theme);

        };


    window.threadlyGetTheme =
        function () {

            return getSavedTheme();

        };


    // -----------------------------------------
    // INITIALIZE THEME
    // -----------------------------------------

    function initializeTheme() {

        applyTheme(
            getSavedTheme()
        );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeTheme,
            {
                once: true
            }
        );

    } else {

        initializeTheme();

    }


    // -----------------------------------------
    // DATA-THEME BUTTONS
    // -----------------------------------------

    document.addEventListener(
        "click",
        function (event) {

            const themeButton =
                event.target.closest(
                    "[data-theme]"
                );


            if (!themeButton) {
                return;
            }


            const selectedTheme =
                themeButton.dataset.theme;


            if (
                selectedTheme !== "light" &&
                selectedTheme !== "dark" &&
                selectedTheme !== "system"
            ) {
                return;
            }


            applyTheme(
                selectedTheme
            );

        }
    );


    // -----------------------------------------
    // SETTINGS THEME BUTTONS
    // -----------------------------------------

    function connectThemeButton(
        id,
        theme
    ) {

        const button =
            document.getElementById(id);


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                applyTheme(theme);

            }
        );

    }


    connectThemeButton(
        "themeLight",
        "light"
    );


    connectThemeButton(
        "themeDark",
        "dark"
    );


    connectThemeButton(
        "themeSystem",
        "system"
    );


    // -----------------------------------------
    // SYSTEM THEME CHANGE
    // -----------------------------------------

    if (window.matchMedia) {

        const systemThemeQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );


        function handleSystemThemeChange() {

            if (
                getSavedTheme() === "system"
            ) {

                applyTheme("system");

            }

        }


        if (
            typeof systemThemeQuery.addEventListener ===
            "function"
        ) {

            systemThemeQuery.addEventListener(
                "change",
                handleSystemThemeChange
            );

        } else if (
            typeof systemThemeQuery.addListener ===
            "function"
        ) {

            systemThemeQuery.addListener(
                handleSystemThemeChange
            );

        }

    }

})();
// =========================================
// PRODUCT DATABASE
// =========================================

const products = {

    "hoodie-001": {
        name: "Oversized Hoodie",
        category: "MEN'S COLLECTION",
        filterCategory: "men",
        price: 25000,
        image: "images/hoodie-001.jpg",
        inStock: true,
        description:
            "A relaxed oversized hoodie designed for everyday comfort and effortless style.",
        sizes: ["S", "M", "L", "XL"]
    },

    "shirt-001": {
        name: "Classic White Shirt",
        category: "MEN'S COLLECTION",
        filterCategory: "men",
        price: 18000,
        image: "images/shirt-001.jpg",
        inStock: true,
        description:
            "A clean classic shirt designed for a simple and timeless everyday look.",
        sizes: ["S", "M", "L", "XL"]
    },

    "cargo-001": {
        name: "Cargo Trousers",
        category: "MEN'S COLLECTION",
        filterCategory: "men",
        price: 32000,
        image: "images/cargo-001.jpg",
        inStock: true,
        description:
            "Relaxed cargo trousers with a practical design for everyday wear.",
        sizes: ["S", "M", "L", "XL"]
    },

    "denim-001": {
        name: "Denim Jacket",
        category: "MEN'S COLLECTION",
        filterCategory: "men",
        price: 40000,
        image: "images/denim-001.jpg",
        inStock: true,
        description:
            "A versatile denim jacket designed to add an effortless layer to your outfit.",
        sizes: ["S", "M", "L", "XL"]
    },

    "shoe-001": {
        name: "Classic Runner",
        category: "SHOES",
        filterCategory: "shoes",
        price: 35000,
        image: "images/shoe-001.jpg",
        inStock: true,
        description:
            "A clean everyday sneaker designed for comfort and casual styling.",
        sizes: ["39", "40", "41", "42", "43", "44"]
    },

    "shoe-002": {
        name: "Street Sneaker",
        category: "SHOES",
        filterCategory: "shoes",
        price: 42000,
        image: "images/shoe-002.jpg",
        inStock: true,
        description:
            "A modern street sneaker designed for everyday movement and casual outfits.",
        sizes: ["39", "40", "41", "42", "43", "44"]
    }

};

// =========================================
// SECTION 4: SIGNUP
// =========================================

(function () {

    const signupForm =
        document.getElementById("signupForm");

    if (!signupForm) return;

    const signupName =
        document.getElementById("signupName");

    const signupEmail =
        document.getElementById("signupEmail");

    const signupPhone =
        document.getElementById("signupPhone");

    const signupUsername =
        document.getElementById("signupUsername");

    const signupPassword =
        document.getElementById("signupPassword");

    const signupConfirmPassword =
        document.getElementById("signupConfirmPassword");

    const signupMessage =
        document.getElementById("signupMessage");


    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                signupName?.value.trim() || "";

            const email =
                signupEmail?.value.trim().toLowerCase() || "";

            const phone =
                signupPhone?.value.trim() || "";

            const username =
                signupUsername?.value.trim().toLowerCase() || "";

            const password =
                signupPassword?.value || "";

            const confirmPassword =
                signupConfirmPassword?.value || "";


            signupMessage.textContent = "";


            // =========================================
            // CHECK ALL FIELDS
            // =========================================

            if (
                !name ||
                !email ||
                !phone ||
                !username ||
                !password ||
                !confirmPassword
            ) {

                signupMessage.textContent =
                    "Please fill in all fields.";

                return;
            }


            // =========================================
            // CHECK PASSWORD LENGTH
            // =========================================

            if (password.length < 8) {

                signupMessage.textContent =
                    "Your password must be at least 8 characters long.";

                return;
            }


            // =========================================
            // CHECK CAPITAL LETTER
            // =========================================

            if (!/[A-Z]/.test(password)) {

                signupMessage.textContent =
                    "Your password must contain at least one capital letter (A-Z).";

                return;
            }


            // =========================================
            // CHECK PASSWORD CONFIRMATION
            // =========================================

            if (password !== confirmPassword) {

                signupMessage.textContent =
                    "The passwords do not match. Please enter the same password in both fields.";

                return;
            }


            // =========================================
            // CHECK SUPABASE CONNECTION
            // =========================================

            const supabase =
                window.threadlySupabase;

            if (!supabase) {

                signupMessage.textContent =
                    "Authentication service is unavailable.";

                console.error(
                    "THREADLY Supabase client was not found."
                );

                return;
            }


            signupMessage.textContent =
                "Creating your account...";


            // =========================================
            // CREATE ACCOUNT
            // =========================================

            const { data, error } =
                await supabase.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {

                            full_name: name,

                            phone: phone,

                            username: username

                        },

                        emailRedirectTo:
                            window.location.origin +
                            "/login.html"

                    }

                });


            // =========================================
            // HANDLE SUPABASE ERROR
            // =========================================

            if (error) {

                console.error(
                    "THREADLY signup error:",
                    error
                );

                signupMessage.textContent =
                    error.message;

                return;
            }


            // =========================================
            // CHECK USER
            // =========================================

            if (!data.user) {

                signupMessage.textContent =
                    "Account could not be created.";

                return;
            }


            // =========================================
            // SAVE NON-SENSITIVE USER INFORMATION
            // =========================================

            localStorage.setItem(
                "threadlyUser",
                JSON.stringify({

                    name: name,

                    email: email,

                    phone: phone,

                    username: username

                })
            );


            // =========================================
            // SIGN OUT IMMEDIATELY
            // =========================================

            await supabase.auth.signOut();

            localStorage.removeItem(
                "threadlyLoggedIn"
            );


            // =========================================
            // SEND CUSTOMER TO LOGIN
            // =========================================

            signupMessage.textContent =
                "Account created successfully. Redirecting to login...";


            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 700);

        }
    );

})();


// =========================================
// SECTION 5: LOGIN
// =========================================

(function () {

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) return;

    const loginEmail =
        document.getElementById("loginEmail");

    const loginPassword =
        document.getElementById("loginPassword");

    const loginMessage =
        document.getElementById("loginMessage");

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                loginEmail?.value.trim().toLowerCase() || "";

            const password =
                loginPassword?.value || "";

            loginMessage.textContent = "";

            // =========================================
            // CHECK FIELDS
            // =========================================

            if (!email || !password) {

                loginMessage.textContent =
                    "Please enter your email and password.";

                return;
            }

            // =========================================
            // CHECK SUPABASE
            // =========================================

            const supabase =
                window.threadlySupabase;

            if (!supabase) {

                loginMessage.textContent =
                    "Authentication service is unavailable.";

                console.error(
                    "THREADLY Supabase client was not found."
                );

                return;
            }

            loginMessage.textContent =
                "Signing you in...";

            // =========================================
            // SUPABASE LOGIN
            // =========================================

            const { data, error } =
                await supabase.auth.signInWithPassword({

                    email: email,

                    password: password

                });

            // =========================================
            // HANDLE ERROR
            // =========================================

            if (error) {

                console.error(
                    "THREADLY login error:",
                    error
                );

                loginMessage.textContent =
                    "Incorrect email or password.";

                return;
            }

            // =========================================
            // CHECK SESSION
            // =========================================

            if (!data.session || !data.user) {

                loginMessage.textContent =
                    "Login could not be completed.";

                return;
            }

            // =========================================
            // SAVE NON-SENSITIVE USER INFORMATION
            // =========================================

            const metadata =
                data.user.user_metadata || {};

            localStorage.setItem(
                "threadlyUser",
                JSON.stringify({

                    name:
                        metadata.full_name || "",

                    email:
                        data.user.email || email,

                    phone:
                        metadata.phone || "",

                    username:
                        metadata.username || ""

                })
            );

            localStorage.setItem(
                "threadlyLoggedIn",
                "true"
            );

            // =========================================
            // RETURN TO ORIGINAL PAGE
            // =========================================

            const params =
                new URLSearchParams(
                    window.location.search
                );

            const redirect =
                params.get("redirect");

            if (redirect) {

                window.location.href =
                    decodeURIComponent(redirect);

            } else {

                window.location.href =
                    "index.html";

            }

        }
    );

})();


// =========================================
// SECTION 6: HOME SEARCH
// =========================================

(function () {

    const searchInput =
        document.getElementById("homeSearchInput");

    const searchButton =
        document.getElementById("homeSearchButton");

    if (!searchInput || !searchButton) return;

    function performHomeSearch() {

        const search =
            searchInput.value.trim();

        if (!search) {

            window.location.href = "shop.html";

            return;
        }

        window.location.href =
            "shop.html?search=" +
            encodeURIComponent(search);

    }

    searchButton.addEventListener(
        "click",
        performHomeSearch
    );

    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                performHomeSearch();

            }

        }
    );

})();
// =========================================
// SECTION 7: SHOP
// =========================================

(function () {

    const shopPage =
        document.querySelector(".shop-page");

    if (!shopPage) return;

    const productCards =
        document.querySelectorAll(
            ".shop-products .shop-product-card"
        );

    const searchInput =
        document.getElementById("shopSearch");

    const searchButton =
        document.getElementById("shopSearchButton");

    const filterButtons =
        document.querySelectorAll(
            ".shop-controls .filters button[data-filter]"
        );

    const filterToggle =
        document.getElementById("filterToggle");

    const filterPanel =
        document.getElementById("filterPanel");

    const filterClose =
        document.getElementById("filterClose");

    const applyFiltersButton =
        document.getElementById("applyFilters");

    const clearFiltersButton =
        document.getElementById("clearFilters");

    const minPrice =
        document.getElementById("minPrice");

    const maxPrice =
        document.getElementById("maxPrice");

    const minPriceValue =
        document.getElementById("minPriceValue");

    const maxPriceValue =
        document.getElementById("maxPriceValue");

    const sortSelect =
        document.getElementById("sortProducts");

    const stockSelect =
        document.getElementById("stockFilter");

    let activeCategory = "all";
    let activeSearch = "";

    // -----------------------------------------
    // GET PRODUCT ID FROM CARD
    // -----------------------------------------

    function getShopProductId(card) {

        if (!card) return null;

        const link =
            card.querySelector(
                'a[href*="product.html?id="]'
            );

        if (!link) return null;

        const href =
            link.getAttribute("href");

        if (!href) return null;

        try {

            const url =
                new URL(
                    href,
                    window.location.href
                );

            return url.searchParams.get("id");

        } catch (error) {

            return null;

        }

    }

    // -----------------------------------------
    // GET PRICE FROM PRODUCT
    // -----------------------------------------

    function getProductPrice(product) {

        return Number(product.price || 0);

    }

    // -----------------------------------------
    // NO RESULTS MESSAGE
    // -----------------------------------------

    function updateShopNoResults(visibleCards) {

        let noResults =
            document.getElementById(
                "shopNoResults"
            );

        if (!noResults) {

            noResults =
                document.createElement("div");

            noResults.id =
                "shopNoResults";

            noResults.className =
                "shop-no-results";

            noResults.textContent =
                "No products found.";

            const productsContainer =
                document.querySelector(
                    ".shop-products"
                );

            if (productsContainer) {

                productsContainer.appendChild(
                    noResults
                );

            }

        }

        noResults.style.display =
            visibleCards === 0
                ? "block"
                : "none";

    }

    // -----------------------------------------
    // APPLY SHOP FILTERS
    // -----------------------------------------

    function applyShopFilters() {

        const search =
            activeSearch.toLowerCase();

        const min =
            minPrice
                ? Number(minPrice.value || 0)
                : 0;

        const max =
            maxPrice
                ? Number(maxPrice.value || Infinity)
                : Infinity;

        const stock =
            stockSelect
                ? stockSelect.value
                : "all";

        let visibleCards = [];

        productCards.forEach(function (card) {

            const productId =
                getShopProductId(card);

            const product =
                products[productId];

            if (!product) {

                card.style.display = "none";

                return;

            }

            const matchesCategory =
                activeCategory === "all" ||
                product.filterCategory === activeCategory;

            const searchableText =
                (
                    product.name +
                    " " +
                    product.category +
                    " " +
                    product.filterCategory
                ).toLowerCase();

            const matchesSearch =
                !search ||
                searchableText.includes(search);

            const matchesPrice =
                getProductPrice(product) >= min &&
                getProductPrice(product) <= max;

            const matchesStock =
                stock === "all" ||
                (
                    stock === "in-stock" &&
                    product.inStock
                ) ||
                (
                    stock === "out-of-stock" &&
                    !product.inStock
                );

            const shouldShow =
                matchesCategory &&
                matchesSearch &&
                matchesPrice &&
                matchesStock;

            card.style.display =
                shouldShow ? "" : "none";

            if (shouldShow) {

                visibleCards.push({
                    card: card,
                    product: product
                });

            }

        });

        // -----------------------------------------
        // SORT
        // -----------------------------------------

        if (sortSelect && visibleCards.length) {

            const sort =
                sortSelect.value;

            visibleCards.sort(function (a, b) {

                if (sort === "price-low") {

                    return (
                        getProductPrice(a.product) -
                        getProductPrice(b.product)
                    );

                }

                if (sort === "price-high") {

                    return (
                        getProductPrice(b.product) -
                        getProductPrice(a.product)
                    );

                }

                if (sort === "name") {

                    return a.product.name.localeCompare(
                        b.product.name
                    );

                }

                return 0;

            });

            const container =
                document.querySelector(
                    ".shop-products"
                );

            if (container) {

                visibleCards.forEach(function (item) {

                    container.appendChild(
                        item.card
                    );

                });

            }

        }

        updateShopNoResults(
            visibleCards.length
        );

    }

    // -----------------------------------------
    // CATEGORY BUTTONS
    // -----------------------------------------

    filterButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                button.classList.add("active");

                activeCategory =
                    button.dataset.filter ||
                    "all";

                applyShopFilters();

            }
        );

    });

    // -----------------------------------------
    // SEARCH
    // -----------------------------------------

    function performShopSearch() {

        activeSearch =
            searchInput
                ? searchInput.value.trim()
                : "";

        applyShopFilters();

    }

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performShopSearch
        );

    }

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performShopSearch();

                }

            }
        );

        searchInput.addEventListener(
            "input",
            function () {

                activeSearch =
                    searchInput.value.trim();

                applyShopFilters();

            }
        );

    }

    // -----------------------------------------
    // FILTER PANEL
    // -----------------------------------------

    if (filterToggle && filterPanel) {

        filterToggle.addEventListener(
            "click",
            function () {

                filterPanel.classList.toggle(
                    "active"
                );

            }
        );

    }

    if (filterClose && filterPanel) {

        filterClose.addEventListener(
            "click",
            function () {

                filterPanel.classList.remove(
                    "active"
                );

            }
        );

    }

    // -----------------------------------------
    // PRICE DISPLAY
    // -----------------------------------------

    function updatePriceLabels() {

        if (minPriceValue && minPrice) {

            minPriceValue.textContent =
                "₦" +
                Number(
                    minPrice.value
                ).toLocaleString("en-NG");

        }

        if (maxPriceValue && maxPrice) {

            maxPriceValue.textContent =
                "₦" +
                Number(
                    maxPrice.value
                ).toLocaleString("en-NG");

        }

    }

    if (minPrice) {

        minPrice.addEventListener(
            "input",
            updatePriceLabels
        );

    }

    if (maxPrice) {

        maxPrice.addEventListener(
            "input",
            updatePriceLabels
        );

    }

    // -----------------------------------------
    // APPLY FILTER BUTTON
    // -----------------------------------------

    if (applyFiltersButton) {

        applyFiltersButton.addEventListener(
            "click",
            function () {

                applyShopFilters();

                if (filterPanel) {

                    filterPanel.classList.remove(
                        "active"
                    );

                }

            }
        );

    }

    // -----------------------------------------
    // CLEAR FILTERS
    // -----------------------------------------

    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            function () {

                activeCategory = "all";
                activeSearch = "";

                if (searchInput) {
                    searchInput.value = "";
                }

                if (minPrice) {
                    minPrice.value =
                        minPrice.min || 0;
                }

                if (maxPrice) {
                    maxPrice.value =
                        maxPrice.max || 100000;
                }

                if (stockSelect) {
                    stockSelect.value = "all";
                }

                if (sortSelect) {
                    sortSelect.value = "default";
                }

                filterButtons.forEach(
                    function (button) {

                        button.classList.remove(
                            "active"
                        );

                        if (
                            button.dataset.filter ===
                            "all"
                        ) {

                            button.classList.add(
                                "active"
                            );

                        }

                    }
                );

                updatePriceLabels();
                applyShopFilters();

            }
        );

    }

    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            applyShopFilters
        );

    }

    if (stockSelect) {

        stockSelect.addEventListener(
            "change",
            applyShopFilters
        );

    }

    // -----------------------------------------
    // READ SEARCH FROM HOMEPAGE URL
    // -----------------------------------------

    const params =
        new URLSearchParams(
            window.location.search
        );

    const urlSearch =
        params.get("search");

    const urlCategory =
        params.get("category");

    if (urlSearch) {

        activeSearch =
            urlSearch.trim();

        if (searchInput) {
            searchInput.value =
                activeSearch;
        }

    }

    if (urlCategory) {

        activeCategory =
            urlCategory.toLowerCase();

        filterButtons.forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.filter ===
                    activeCategory
                );

            }
        );

    }

    updatePriceLabels();
    applyShopFilters();

})();
// =========================================
// SECTION 8: PRODUCT PAGE
// =========================================

(function () {

    const productPage =
        document.querySelector(".product-page");

    if (!productPage) return;

    // -----------------------------------------
    // GET PRODUCT ID FROM URL
    // -----------------------------------------

    const params =
        new URLSearchParams(
            window.location.search
        );

    const productId =
        params.get("id");

    const product =
        products[productId];

    // -----------------------------------------
    // CHECK PRODUCT
    // -----------------------------------------

    if (!product) {
        return;
    }

    // -----------------------------------------
    // PRODUCT ELEMENTS
    // -----------------------------------------

    const productImage =
        document.getElementById("productImage");

    const productName =
        document.getElementById("productName");

    const productPrice =
        document.getElementById("productPrice");

    const productCategory =
        document.getElementById("productCategory");

    const productDescription =
        document.querySelector(".product-description");

    const sizeSection =
        document.getElementById("sizeSection");

    const sizeOptions =
        document.getElementById("sizeOptions");

    const selectedSize =
        document.getElementById("selectedSize");

    const quantityDisplay =
        document.getElementById("quantity");

    const decreaseQuantity =
        document.getElementById("decreaseQuantity");

    const increaseQuantity =
        document.getElementById("increaseQuantity");

    const addToCartButton =
        document.getElementById("addToCartButton");

    const saveProductButton =
        document.getElementById("saveProductButton");

    const thumbnails =
        document.getElementById("productThumbnails");

    // -----------------------------------------
    // PRODUCT INFORMATION
    // -----------------------------------------

    if (productName) {
        productName.textContent =
            product.name;
    }

    if (productCategory) {
        productCategory.textContent =
            product.category;
    }

    if (productPrice) {
        productPrice.textContent =
            "₦" +
            Number(product.price)
                .toLocaleString("en-NG");
    }

    if (productDescription) {
        productDescription.textContent =
            product.description;
    }

    // -----------------------------------------
    // PRODUCT IMAGE
    // -----------------------------------------

    if (productImage) {

        productImage.src =
            product.image;

        productImage.alt =
            product.name;

        productImage.onerror =
            function () {

                this.style.display = "none";

            };

    }

    // -----------------------------------------
    // THUMBNAIL
    // -----------------------------------------

    if (thumbnails && productImage) {

        thumbnails.innerHTML = "";

        const thumbnail =
            document.createElement("button");

        thumbnail.type = "button";
        thumbnail.className =
            "product-thumbnail active";

        thumbnail.innerHTML = `
            <img
                src="${product.image}"
                alt="${product.name}"
            >
        `;

        thumbnail.addEventListener(
            "click",
            function () {

                productImage.src =
                    product.image;

                thumbnails
                    .querySelectorAll(
                        ".product-thumbnail"
                    )
                    .forEach(function (item) {

                        item.classList.remove(
                            "active"
                        );

                    });

                thumbnail.classList.add(
                    "active"
                );

            }
        );

        thumbnails.appendChild(
            thumbnail
        );

    }

// -----------------------------------------
// SIZE SELECTION
// -----------------------------------------

let currentSize = "";

if (
    sizeOptions &&
    product.sizes &&
    product.sizes.length
) {

    sizeOptions.innerHTML = "";

    product.sizes.forEach(
        function (size) {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "size-button";

            button.textContent =
                size;

            button.addEventListener(
                "click",
                function () {

                    currentSize =
                        String(size);

                    sizeOptions
                        .querySelectorAll(
                            ".size-button"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );

                    button.classList.add(
                        "active"
                    );

                    if (selectedSize) {

                        selectedSize.textContent =
                            currentSize;

                    }

                }
            );

            sizeOptions.appendChild(
                button
            );

        }
    );

} else {

    currentSize = "One size";

    if (sizeSection) {
        sizeSection.style.display =
            "none";
    }

}
    // -----------------------------------------
// QUANTITY
// -----------------------------------------

let quantity = 1;

function updateQuantity() {

    if (quantity < 1) {
        quantity = 1;
    }

    if (quantityDisplay) {

        quantityDisplay.textContent =
            quantity;

    }

}

if (increaseQuantity) {

    increaseQuantity.addEventListener(
        "click",
        function () {

            quantity++;

            updateQuantity();

        }
    );

}

if (decreaseQuantity) {

    decreaseQuantity.addEventListener(
        "click",
        function () {

            if (quantity > 1) {

                quantity--;

                updateQuantity();

            }

        }
    );

}

updateQuantity();

    // -----------------------------------------
    // CART STORAGE
    // -----------------------------------------

    function getCart() {

        try {

            const cart =
                JSON.parse(
                    localStorage.getItem(
                        "threadlyCart"
                    )
                );

            return Array.isArray(cart)
                ? cart
                : [];

        } catch (error) {

            return [];

        }

    }

    function saveCart(cart) {

        localStorage.setItem(
            "threadlyCart",
            JSON.stringify(cart)
        );

    }

    // -----------------------------------------
    // ADD TO CART
    // -----------------------------------------

    if (addToCartButton) {

        addToCartButton.addEventListener(
            "click",
            function () {
                if (
                 typeof window.threadlyRequireLogin ===
                 "function" &&
                 !window.threadlyRequireLogin()
                ) {
                 return;
                }

                if (
                    product.sizes &&
                    product.sizes.length &&
                    !currentSize
                ) {

                    if (selectedSize) {

                        selectedSize.textContent =
                            "Please select a size";

                    }

                    return;

                }


                const cart =
                    getCart();

                const existingItem =
                    cart.find(function (item) {

                        return (
                            item.id === productId &&
                            String(item.size) ===
                                String(currentSize)
                        );

                    });

                if (existingItem) {

                    existingItem.quantity +=
                        quantity;

                } else {

                    cart.push({

                        id: productId,

                        name: product.name,

                        price: product.price,

                        image: product.image,

                        size: currentSize ||
                            "One size",

                        quantity: quantity

                    });

                }

                saveCart(cart);

                const originalText =
                    addToCartButton.textContent;

                addToCartButton.textContent =
                    "ADDED TO CART";

                addToCartButton.disabled =
                    true;

                setTimeout(
                    function () {

                        addToCartButton.textContent =
                            originalText;

                        addToCartButton.disabled =
                            false;

                    },
                    1200
                );

            }
        );

    }

    // -----------------------------------------
    // SAVED ITEMS
    // -----------------------------------------

    function getSavedItems() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "threadlySaved"
                    )
                );

            if (!Array.isArray(saved)) {
                return [];
            }

            return saved.map(
                function (item) {

                    if (
                        typeof item ===
                        "string"
                    ) {
                        return item;
                    }

                    return item &&
                        item.id
                        ? item.id
                        : null;

                }
            ).filter(Boolean);

        } catch (error) {

            return [];

        }

    }

    function saveSavedItems(items) {

        localStorage.setItem(
            "threadlySaved",
            JSON.stringify(items)
        );

    }

    function updateSaveButton() {

        if (!saveProductButton) return;

        const savedItems =
            getSavedItems();

        const isSaved =
            savedItems.includes(
                productId
            );

        saveProductButton.textContent =
            isSaved
                ? "SAVED"
                : "SAVE ITEM";

        saveProductButton.classList.toggle(
            "active",
            isSaved
        );

    }

    if (saveProductButton) {

        saveProductButton.addEventListener(
            "click",
            function () {

                let savedItems =
                    getSavedItems();

                const index =
                    savedItems.indexOf(
                        productId
                    );

                if (index === -1) {

                    savedItems.push(
                        productId
                    );

                } else {

                    savedItems.splice(
                        index,
                        1
                    );

                }

                saveSavedItems(
                    savedItems
                );

                updateSaveButton();

            }
        );

    }

    updateSaveButton();

    // -----------------------------------------
    // RELATED PRODUCTS
    // -----------------------------------------

    const relatedProducts =
        document.getElementById(
            "relatedProducts"
        );

    if (relatedProducts) {

        relatedProducts.innerHTML = "";

        Object.entries(products)
            .filter(function ([id, item]) {

                return (
                    id !== productId &&
                    item.filterCategory ===
                        product.filterCategory
                );

            })
            .slice(0, 4)
            .forEach(function ([id, item]) {

                const card =
                    document.createElement("a");

                card.href =
                    "product.html?id=" +
                    encodeURIComponent(id);

                card.className =
                    "related-product-card";

                card.innerHTML = `
                    <div class="related-product-image">
                        <img
                            src="${item.image}"
                            alt="${item.name}"
                        >
                    </div>

                    <div class="related-product-info">
                        <h3>${item.name}</h3>
                        <p>
                            ₦${Number(item.price)
                                .toLocaleString("en-NG")}
                        </p>
                    </div>
                `;

                relatedProducts.appendChild(
                    card
                );

            });

    }

})();
// =========================================
// SECTION 9: CART
// =========================================

(function () {

    const cartPage =
        document.querySelector(".cart-page");

    if (!cartPage) return;

    const cartContainer =
        document.getElementById("cartItems");

    const cartEmpty =
        document.getElementById("cartEmpty");

    const subtotalElement =
        document.getElementById("cartSubtotal");

    const deliveryElement =
        document.getElementById("cartDelivery");

    const totalElement =
        document.getElementById("cartTotal");

    const checkoutButton =
        document.getElementById("checkoutButton");

    const STANDARD_DELIVERY = 2500;

    // -----------------------------------------
    // GET CART
    // -----------------------------------------

    function getCart() {

        try {

            const cart =
                JSON.parse(
                    localStorage.getItem(
                        "threadlyCart"
                    )
                );

            return Array.isArray(cart)
                ? cart
                : [];

        } catch (error) {

            return [];

        }

    }

    // -----------------------------------------
    // SAVE CART
    // -----------------------------------------

    function saveCart(cart) {

        localStorage.setItem(
            "threadlyCart",
            JSON.stringify(cart)
        );

    }

    // -----------------------------------------
    // FORMAT PRICE
    // -----------------------------------------

    function formatPrice(price) {

        return "₦" +
            Number(price || 0)
                .toLocaleString("en-NG");

    }

    // -----------------------------------------
    // RENDER CART
    // -----------------------------------------

    function renderCart() {

        const cart = getCart();

        if (!cartContainer) return;

        cartContainer.innerHTML = "";

        if (!cart.length) {

            if (cartEmpty) {
                cartEmpty.style.display = "block";
            }

            if (subtotalElement) {
                subtotalElement.textContent =
                    formatPrice(0);
            }

            if (deliveryElement) {
                deliveryElement.textContent =
                    formatPrice(0);
            }

            if (totalElement) {
                totalElement.textContent =
                    formatPrice(0);
            }

            if (checkoutButton) {
                checkoutButton.disabled = true;
            }

            return;

        }

        if (cartEmpty) {
            cartEmpty.style.display = "none";
        }

        let subtotal = 0;

        cart.forEach(function (item, index) {

            const quantity =
                Number(item.quantity || 1);

            const price =
                Number(item.price || 0);

            subtotal +=
                price * quantity;

            const cartItem =
                document.createElement("article");

            cartItem.className =
                "cart-item";

            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <a href="product.html?id=${encodeURIComponent(item.id)}">
                        <img
                            src="${item.image || ""}"
                            alt="${item.name || "Product"}"
                        >
                    </a>
                </div>

                <div class="cart-item-info">

                    <h3>${item.name || "Product"}</h3>

                    <p class="cart-item-size">
                        Size: ${item.size || "One size"}
                    </p>

                    <strong>
                        ${formatPrice(price)}
                    </strong>

                    <div class="cart-item-actions">

                        <div class="cart-quantity">

                            <button
                                type="button"
                                class="cart-quantity-minus"
                                data-index="${index}"
                            >
                                −
                            </button>

                            <span>
                                ${quantity}
                            </span>

                            <button
                                type="button"
                                class="cart-quantity-plus"
                                data-index="${index}"
                            >
                                +
                            </button>

                        </div>

                        <button
                            type="button"
                            class="cart-remove"
                            data-index="${index}"
                        >
                            REMOVE
                        </button>

                    </div>

                </div>
            `;

            cartContainer.appendChild(
                cartItem
            );

        });

        // -----------------------------------------
        // QUANTITY BUTTONS
        // -----------------------------------------

        cartContainer
            .querySelectorAll(
                ".cart-quantity-minus"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        const updatedCart =
                            getCart();

                        if (
                            updatedCart[index] &&
                            Number(
                                updatedCart[index]
                                    .quantity
                            ) > 1
                        ) {

                            updatedCart[index]
                                .quantity--;

                            saveCart(
                                updatedCart
                            );

                            renderCart();

                        }

                    }
                );

            });

        cartContainer
            .querySelectorAll(
                ".cart-quantity-plus"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        const updatedCart =
                            getCart();

                        if (updatedCart[index]) {

                            updatedCart[index]
                                .quantity++;

                            saveCart(
                                updatedCart
                            );

                            renderCart();

                        }

                    }
                );

            });

        // -----------------------------------------
        // REMOVE BUTTONS
        // -----------------------------------------

        cartContainer
            .querySelectorAll(
                ".cart-remove"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        const updatedCart =
                            getCart();

                        updatedCart.splice(
                            index,
                            1
                        );

                        saveCart(
                            updatedCart
                        );

                        renderCart();

                    }
                );

            });

        // -----------------------------------------
        // TOTALS
        // -----------------------------------------

        const delivery =
            STANDARD_DELIVERY;

        const total =
            subtotal + delivery;

        if (subtotalElement) {

            subtotalElement.textContent =
                formatPrice(subtotal);

        }

        if (deliveryElement) {

            deliveryElement.textContent =
                formatPrice(delivery);

        }

        if (totalElement) {

            totalElement.textContent =
                formatPrice(total);

        }

        if (checkoutButton) {

            checkoutButton.disabled = false;

        }

    }

    // -----------------------------------------
    // CHECKOUT BUTTON
    // -----------------------------------------

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                const cart = getCart();

                if (!cart.length) return;

                window.location.href =
                    "checkout.html";

            }
        );

    }

    renderCart();

})();
// =========================================
// SECTION 10: CHECKOUT
// =========================================

(function () {

    const checkoutPage =
        document.querySelector(".checkout-page");

    if (!checkoutPage) return;

    const checkoutItems =
        document.getElementById("checkoutItems");

    const checkoutSubtotal =
        document.getElementById("checkoutSubtotal");

    const checkoutDelivery =
        document.getElementById("checkoutDelivery");

    const checkoutTotal =
        document.getElementById("checkoutTotal");

    const checkoutForm =
        document.getElementById("checkoutForm");

    const deliveryOptions =
        document.querySelectorAll(
            'input[name="deliveryMethod"]'
        );

    const STANDARD_DELIVERY = 2500;
    const EXPRESS_DELIVERY = 4500;


    // -----------------------------------------
    // GET CART
    // -----------------------------------------

    function getCart() {

        try {

            const cart =
                JSON.parse(
                    localStorage.getItem(
                        "threadlyCart"
                    )
                );

            return Array.isArray(cart)
                ? cart
                : [];

        } catch (error) {

            return [];

        }

    }


    // -----------------------------------------
    // FORMAT PRICE
    // -----------------------------------------

    function formatPrice(price) {

        return "₦" +
            Number(price || 0)
                .toLocaleString("en-NG");

    }


    // -----------------------------------------
    // GET SELECTED DELIVERY
    // -----------------------------------------

    function getSelectedDelivery() {

        const selected =
            document.querySelector(
                'input[name="deliveryMethod"]:checked'
            );

        return selected
            ? selected.value
            : "standard";

    }


    // -----------------------------------------
    // GET DELIVERY FEE
    // -----------------------------------------

    function getDeliveryFee() {

        const delivery =
            getSelectedDelivery();

        if (delivery === "express") {

            return EXPRESS_DELIVERY;

        }

        return STANDARD_DELIVERY;

    }


    // -----------------------------------------
    // UPDATE TOTALS
    // -----------------------------------------

    function updateCheckoutTotal() {

        const cart = getCart();

        let subtotal = 0;

        cart.forEach(function (item) {

            subtotal +=
                Number(item.price || 0) *
                Number(item.quantity || 1);

        });

        const delivery =
            getDeliveryFee();

        const total =
            subtotal + delivery;


        if (checkoutSubtotal) {

            checkoutSubtotal.textContent =
                formatPrice(subtotal);

        }


        if (checkoutDelivery) {

            checkoutDelivery.textContent =
                formatPrice(delivery);

        }


        if (checkoutTotal) {

            checkoutTotal.textContent =
                formatPrice(total);

        }

    }


    // -----------------------------------------
    // RENDER CHECKOUT ITEMS
    // -----------------------------------------

    function renderCheckoutItems() {

        const cart = getCart();

        if (!checkoutItems) return;

        checkoutItems.innerHTML = "";


        if (!cart.length) {

            checkoutItems.innerHTML = `
                <p class="checkout-empty">
                    Your cart is empty.
                </p>
            `;

            return;

        }


        cart.forEach(function (item) {

            const element =
                document.createElement("div");

            element.className =
                "checkout-item";


            element.innerHTML = `
                <div class="checkout-item-image">

                    <img
                        src="${item.image || ""}"
                        alt="${item.name || "Product"}"
                    >

                </div>


                <div class="checkout-item-info">

                    <h3>
                        ${item.name || "Product"}
                    </h3>

                    <p>
                        Size:
                        ${item.size || "One size"}
                    </p>

                    <p>
                        Quantity:
                        ${item.quantity || 1}
                    </p>

                </div>


                <strong>
                    ${formatPrice(
                        Number(item.price || 0) *
                        Number(item.quantity || 1)
                    )}
                </strong>
            `;


            checkoutItems.appendChild(
                element
            );

        });

    }


    // -----------------------------------------
    // DELIVERY CHANGE
    // -----------------------------------------

    deliveryOptions.forEach(function (option) {

        option.addEventListener(
            "change",
            updateCheckoutTotal
        );

    });


    // -----------------------------------------
    // CHECKOUT SUBMIT
    // -----------------------------------------

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const cart = getCart();


                if (!cart.length) {

                    return;

                }


                const formData =
                    new FormData(
                        checkoutForm
                    );


                const delivery =
                    getSelectedDelivery();


                const deliveryFee =
                    getDeliveryFee();


                let subtotal = 0;


                cart.forEach(function (item) {

                    subtotal +=
                        Number(item.price || 0) *
                        Number(item.quantity || 1);

                });


                const total =
                    subtotal + deliveryFee;


                // ---------------------------------
                // CUSTOMER INFORMATION
                // ---------------------------------

                const customer = {

                    name:
                        formData.get("fullName") ||
                        "",

                    email:
                        formData.get("email") ||
                        "",

                    phone:
                        formData.get("phone") ||
                        "",

                    address:
                        formData.get("address") ||
                        "",

                    state:
                        formData.get("state") ||
                        "",

                    city:
                        formData.get("city") ||
                        ""

                };


                // ---------------------------------
                // SAVE CHECKOUT INFORMATION
                // ---------------------------------

                localStorage.setItem(
                    "threadlyCheckout",
                    JSON.stringify(customer)
                );


                localStorage.setItem(
                    "threadlyDeliveryMethod",
                    delivery
                );


                localStorage.setItem(
                    "threadlyDeliveryFee",
                    String(deliveryFee)
                );


                localStorage.setItem(
                    "threadlyCheckoutSubtotal",
                    String(subtotal)
                );


                localStorage.setItem(
                    "threadlyCheckoutTotal",
                    String(total)
                );


                // ---------------------------------
                // CREATE ORDER NUMBER
                // ---------------------------------

                const orderNumber =
                    "THR-" +
                    Date.now()
                        .toString()
                        .slice(-6);


                // ---------------------------------
                // CREATE PENDING ORDER
                // ---------------------------------

                const pendingOrder = {

                    id: orderNumber,

                    orderNumber:
                        "#" + orderNumber,

                    date:
                        new Date()
                            .toLocaleDateString(
                                "en-GB",
                                {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                }
                            ),

                    items:
                        cart.map(function (item) {

                            return {

                                id: item.id,

                                name: item.name,

                                price:
                                    Number(
                                        item.price || 0
                                    ),

                                image:
                                    item.image || "",

                                size:
                                    item.size ||
                                    "One size",

                                quantity:
                                    Number(
                                        item.quantity || 1
                                    )

                            };

                        }),

                    subtotal:
                        subtotal,

                    deliveryFee:
                        deliveryFee,

                    deliveryMethod:
                        delivery,

                    total:
                        total,

                    customer:
                        customer,

                    paymentStatus:
                        "pending-verification",

                    paymentMethod:
                        "",

                    deliveryStatus:
                        "processing"

                };


                // ---------------------------------
                // SAVE PENDING ORDER
                // ---------------------------------

                localStorage.setItem(
                    "threadlyPendingOrder",
                    JSON.stringify(
                        pendingOrder
                    )
                );


                // ---------------------------------
                // SAVE ORDER
                // ---------------------------------

                let orders = [];


                try {

                    const savedOrders =
                        JSON.parse(
                            localStorage.getItem(
                                "threadlyOrders"
                            )
                        );


                    if (
                        Array.isArray(
                            savedOrders
                        )
                    ) {

                        orders =
                            savedOrders;

                    }

                } catch (error) {

                    orders = [];

                }


                orders.push(
                    pendingOrder
                );


                localStorage.setItem(
                    "threadlyOrders",
                    JSON.stringify(
                        orders
                    )
                );


                // ---------------------------------
                // CONTINUE TO PAYMENT
                // ---------------------------------

                window.location.href =
                    "payment-method.html";

            }
        );

    }


    // -----------------------------------------
    // INITIAL LOAD
    // -----------------------------------------

    renderCheckoutItems();

    updateCheckoutTotal();

})();
// =========================================
// SECTION 11: ACCOUNT
// =========================================

(function () {

    const accountName =
        document.getElementById(
            "accountName"
        );

    const accountFullName =
        document.getElementById(
            "accountFullName"
        );

    const accountEmail =
        document.getElementById(
            "accountEmail"
        );


    let savedUser = null;


    try {

        savedUser =
            JSON.parse(
                localStorage.getItem(
                    "threadlyUser"
                )
            );

    } catch (error) {

        savedUser = null;

    }


    if (!savedUser) return;


    if (accountName) {

        accountName.textContent =
            savedUser.name || "";

    }


    if (accountFullName) {

        accountFullName.textContent =
            savedUser.name || "";

    }


    if (accountEmail) {

        accountEmail.textContent =
            savedUser.email || "";

    }


    // -----------------------------------------
    // ORDER COUNT
    // -----------------------------------------

    const orderCount =
        document.getElementById(
            "accountOrderCount"
        );


    if (orderCount) {

        let orders = [];

        try {

            const savedOrders =
                JSON.parse(
                    localStorage.getItem(
                        "threadlyOrders"
                    )
                );

            if (Array.isArray(savedOrders)) {

                orders = savedOrders;

            }

        } catch (error) {

            orders = [];

        }


        orderCount.textContent =
            orders.length;

    }


    // -----------------------------------------
    // SAVED ITEMS COUNT
    // -----------------------------------------

    const savedCount =
        document.getElementById(
            "accountSavedCount"
        );


    if (savedCount) {

        let savedItems = [];

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "threadlySaved"
                    )
                );

            if (Array.isArray(saved)) {

                savedItems = saved;

            }

        } catch (error) {

            savedItems = [];

        }


        savedCount.textContent =
            savedItems.length;

    }

})();
/* =========================================================
   SECTION 12: LOGOUT
========================================================= */

(function () {

    const logoutButton =
        document.getElementById("logoutButton");

    const mobileLogout =
        document.getElementById("mobileLogout");


    async function logoutUser(event) {

        if (event) {
            event.preventDefault();
        }


        const supabase =
            window.threadlySupabase;


        // =========================================
        // SIGN OUT FROM SUPABASE
        // =========================================

        if (supabase) {

            try {

                const {
                    error
                } =
                    await supabase.auth.signOut();


                if (error) {

                    console.error(
                        "THREADLY logout error:",
                        error
                    );

                }

            } catch (error) {

                console.error(
                    "THREADLY logout failed:",
                    error
                );

            }

        }


        // =========================================
        // REMOVE OLD COMPATIBILITY DATA
        // =========================================

        localStorage.removeItem(
            "threadlyLoggedIn"
        );

        localStorage.removeItem(
            "threadlyUser"
        );


        // =========================================
        // RETURN TO LOGIN
        // =========================================

        window.location.replace(
            "login.html"
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutUser
        );

    }


    if (mobileLogout) {

        mobileLogout.addEventListener(
            "click",
            logoutUser
        );

    }

})();

/* =========================================================
   SECTION 13: MOBILE MENU
========================================================= */

(function () {

    const menuButton =
        document.getElementById("menuButton");

    const closeMenu =
        document.getElementById("closeMenu");

    const mobileMenu =
        document.getElementById("mobileMenu");

    const menuOverlay =
        document.getElementById("menuOverlay");


    if (!menuButton || !mobileMenu) {
        return;
    }


    function openMenu() {

        mobileMenu.classList.add("active");

        if (menuOverlay) {
            menuOverlay.classList.add("active");
        }

        document.body.style.overflow = "hidden";

    }


    function closeMobileMenu() {

        mobileMenu.classList.remove("active");

        if (menuOverlay) {
            menuOverlay.classList.remove("active");
        }

        document.body.style.overflow = "";

    }


    menuButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openMenu();

        }
    );


    if (closeMenu) {

        closeMenu.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeMobileMenu();

            }
        );

    }


    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            closeMobileMenu
        );

    }


    const mobileLinks =
        mobileMenu.querySelectorAll("a");

    mobileLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            closeMobileMenu
        );

    });


    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {
                closeMobileMenu();
            }

        }
    );

})();
/* =========================================================
   SECTION 14: SAVED ITEMS
========================================================= */

(function () {

    const savedContainer =
        document.getElementById("savedItems");

    if (!savedContainer) {
        return;
    }


    let savedItems = [];

    try {

        const saved =
            JSON.parse(
                localStorage.getItem("threadlySaved")
            );

        if (Array.isArray(saved)) {
            savedItems = saved;
        }

    } catch (error) {

        savedItems = [];

    }


    function getProductId(item) {

        if (typeof item === "string") {
            return item;
        }

        if (item && item.id) {
            return item.id;
        }

        return null;
    }


    function renderSavedItems() {

        savedContainer.innerHTML = "";


        if (savedItems.length === 0) {

            savedContainer.innerHTML = `
                <div class="empty-state">
                    <h2>No saved items</h2>
                    <p>
                        Products you save will appear here.
                    </p>
                    <a href="shop.html" class="primary-button">
                        SHOP NOW
                    </a>
                </div>
            `;

            return;
        }


        savedItems.forEach(function (item) {

            const productId =
                getProductId(item);

            const product =
                products[productId];

            if (!product) {
                return;
            }


            const card =
                document.createElement("article");

            card.className =
                "shop-product-card product-link";


            card.innerHTML = `
                <a href="product.html?id=${encodeURIComponent(productId)}">

                    <div class="product-image">
                        <img
                            src="${product.image}"
                            alt="${product.name}"
                        >
                    </div>

                    <div class="product-card-info">

                        <p class="product-category">
                            ${product.category}
                        </p>

                        <h3>
                            ${product.name}
                        </h3>

                        <p class="product-price">
                            ₦${product.price.toLocaleString()}
                        </p>

                    </div>

                </a>

                <button
                    type="button"
                    class="remove-saved"
                    data-product-id="${productId}"
                >
                    REMOVE
                </button>
            `;


            savedContainer.appendChild(card);

        });


        const removeButtons =
            savedContainer.querySelectorAll(
                ".remove-saved"
            );


        removeButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const productId =
                        button.dataset.productId;

                    savedItems =
                        savedItems.filter(
                            function (item) {
                                return (
                                    getProductId(item) !==
                                    productId
                                );
                            }
                        );


                    localStorage.setItem(
                        "threadlySaved",
                        JSON.stringify(savedItems)
                    );


                    renderSavedItems();

                }
            );

        });

    }


    renderSavedItems();

})();
/* =========================================================
   SECTION 15: PAYMENT METHOD
========================================================= */

(function () {

    const paymentPage =
        document.querySelector(".payment-method-page");

    if (!paymentPage) {
        return;
    }


    const orderSummary =
        document.getElementById("paymentOrderSummary");

    const paymentAmount =
        document.getElementById("paymentAmount");

    const paymentMessage =
        document.getElementById("paymentMessage");


    let pendingOrder = null;

    try {

        pendingOrder =
            JSON.parse(
                localStorage.getItem(
                    "threadlyPendingOrder"
                )
            );

    } catch (error) {

        pendingOrder = null;

    }


    if (!pendingOrder) {

        if (paymentMessage) {
            paymentMessage.textContent =
                "No pending order was found.";
        }

        return;
    }


    function formatNaira(amount) {

        return "₦" +
            Number(amount || 0)
                .toLocaleString();

    }


    if (paymentAmount) {

        paymentAmount.textContent =
            formatNaira(
                pendingOrder.total
            );

    }


    if (orderSummary) {

        orderSummary.innerHTML = `

            <div class="payment-summary-row">
                <span>Order</span>
                <strong>
                    #${pendingOrder.orderNumber || pendingOrder.id}
                </strong>
            </div>

            <div class="payment-summary-row">
                <span>Subtotal</span>
                <strong>
                    ${formatNaira(pendingOrder.subtotal)}
                </strong>
            </div>

            <div class="payment-summary-row">
                <span>
                    ${
                        pendingOrder.deliveryMethod ===
                        "express"
                            ? "Express Delivery"
                            : "Standard Delivery"
                    }
                </span>

                <strong>
                    ${formatNaira(pendingOrder.deliveryFee)}
                </strong>
            </div>

            <div class="payment-summary-row payment-total">
                <span>Total</span>
                <strong>
                    ${formatNaira(pendingOrder.total)}
                </strong>
            </div>

        `;

    }


    const paymentOptions =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    paymentOptions.forEach(
        function (option) {

            option.addEventListener(
                "change",
                function () {

                    if (paymentMessage) {
                        paymentMessage.textContent = "";
                    }

                }
            );

        }
    );


    const continueButton =
        document.getElementById(
            "continuePaymentButton"
        );


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            function () {

                const selected =
                    document.querySelector(
                        'input[name="paymentMethod"]:checked'
                    );


                if (!selected) {

                    if (paymentMessage) {
                        paymentMessage.textContent =
                            "Please select a payment method.";
                    }

                    return;
                }


                const paymentMethod =
                    selected.value;


                localStorage.setItem(
                    "threadlyPaymentMethod",
                    paymentMethod
                );


                pendingOrder.paymentMethod =
                    paymentMethod;


                localStorage.setItem(
                    "threadlyPendingOrder",
                    JSON.stringify(
                        pendingOrder
                    )
                );


                if (
                    paymentMethod ===
                    "bank-transfer"
                ) {

                    window.location.href =
                        "transfer.html";

                    return;
                }


                if (
                    paymentMethod ===
                    "paystack"
                ) {

                    window.location.href =
                        "waiting.html";

                    return;
                }


                if (paymentMessage) {
                    paymentMessage.textContent =
                        "Please select a valid payment method.";
                }

            }
        );

    }

})();
/* =========================================================
   SECTION 16: BANK TRANSFER
========================================================= */

(function () {

    const transferPage =
        document.querySelector(".transfer-page");

    if (!transferPage) {
        return;
    }


    const transferAmount =
        document.getElementById("transferAmount");

    const transferAccountNumber =
        document.getElementById(
            "transferAccountNumber"
        );

    const copyAccountNumber =
        document.getElementById(
            "copyAccountNumber"
        );

    const transferDoneButton =
        document.getElementById(
            "transferDoneButton"
        );

    const copyMessage =
        document.getElementById(
            "copyMessage"
        );


    let pendingOrder = null;


    try {

        pendingOrder =
            JSON.parse(
                localStorage.getItem(
                    "threadlyPendingOrder"
                )
            );

    } catch (error) {

        pendingOrder = null;

    }


    if (!pendingOrder) {

        if (copyMessage) {

            copyMessage.textContent =
                "No pending order was found.";

        }

        return;
    }


    function formatNaira(amount) {

        return "₦" +
            Number(amount || 0)
                .toLocaleString();

    }


    /* SHOW ORDER AMOUNT */

    if (transferAmount) {

        transferAmount.textContent =
            formatNaira(
                pendingOrder.total
            );

    }


    /* COPY ACCOUNT NUMBER */

    if (copyAccountNumber) {

        copyAccountNumber.addEventListener(
            "click",
            async function () {

                if (!transferAccountNumber) {
                    return;
                }


                const accountNumber =
                    transferAccountNumber
                        .textContent
                        .trim();


                try {

                    await navigator.clipboard.writeText(
                        accountNumber
                    );


                    if (copyMessage) {

                        copyMessage.textContent =
                            "Account number copied.";

                    }

                } catch (error) {

                    if (copyMessage) {

                        copyMessage.textContent =
                            "Please copy the account number manually.";

                    }

                }

            }
        );

    }


    /* TRANSFER COMPLETED */

    if (transferDoneButton) {

        transferDoneButton.addEventListener(
            "click",
            function () {

                localStorage.setItem(
                    "threadlyPaymentAmount",
                    String(
                        pendingOrder.total
                    )
                );


                localStorage.setItem(
                    "threadlyPaymentMethod",
                    "transfer"
                );


                localStorage.setItem(
                    "threadlyPaymentStatus",
                    "awaiting-receipt"
                );


                pendingOrder.paymentMethod =
                    "transfer";


                pendingOrder.paymentStatus =
                    "awaiting-receipt";


                localStorage.setItem(
                    "threadlyPendingOrder",
                    JSON.stringify(
                        pendingOrder
                    )
                );


                window.location.href =
                    "receipt.html";

            }
        );

    }

})();
/* =========================================================
   SECTION 17: RECEIPT UPLOAD
========================================================= */

(function () {

    const receiptPage =
        document.querySelector(".receipt-page");

    if (!receiptPage) {
        return;
    }


    const receiptForm =
        document.getElementById("receiptForm");

    const receiptFile =
        document.getElementById("receiptFile");

    const receiptPreview =
        document.getElementById("receiptPreview");

    const receiptPreviewContainer =
        document.getElementById("receiptPreviewContainer");

    const receiptFileName =
        document.getElementById("receiptFileName");

    const removeReceipt =
        document.getElementById("removeReceipt");

    const receiptAmount =
        document.getElementById("receiptAmount");

    const receiptOrderReference =
        document.getElementById("receiptOrderReference");

    const receiptMessage =
        document.getElementById("receiptMessage");

    const submitReceiptButton =
        document.getElementById("submitReceiptButton");


    let pendingOrder = null;


    /* =====================================================
       LOAD PENDING ORDER
    ===================================================== */

    try {

        const savedOrder =
            localStorage.getItem(
                "threadlyPendingOrder"
            );

        if (savedOrder) {

            pendingOrder =
                JSON.parse(savedOrder);

        }

    } catch (error) {

        pendingOrder = null;

    }


    /* =====================================================
       SHOW ORDER INFORMATION
    ===================================================== */

    if (pendingOrder) {

        const orderReference =
            pendingOrder.orderId ||
            pendingOrder.id ||
            pendingOrder.orderReference ||
            "THR-000000";


        const amount =
            Number(
                pendingOrder.total ||
                pendingOrder.amount ||
                pendingOrder.grandTotal ||
                0
            );


        if (receiptOrderReference) {

            receiptOrderReference.textContent =
                orderReference;

        }


        if (receiptAmount) {

            receiptAmount.textContent =
                "₦" +
                amount.toLocaleString();

        }

    } else {

        if (receiptOrderReference) {

            receiptOrderReference.textContent =
                "THR-000000";

        }


        if (receiptAmount) {

            receiptAmount.textContent =
                "₦0";

        }


        if (receiptMessage) {

            receiptMessage.textContent =
                "No pending order was found.";

        }


        if (submitReceiptButton) {

            submitReceiptButton.disabled =
                true;

        }

    }


    /* =====================================================
       SELECT RECEIPT
    ===================================================== */

    if (receiptFile) {

        receiptFile.addEventListener(
            "change",
            function () {

                const file =
                    this.files[0];


                if (!file) {
                    return;
                }


                /* SHOW FILE NAME */

                if (receiptFileName) {

                    receiptFileName.textContent =
                        file.name;

                }


                /* CLEAR MESSAGE */

                if (receiptMessage) {

                    receiptMessage.textContent =
                        "";

                }


                /* SHOW PREVIEW */

                if (receiptPreviewContainer) {

                    receiptPreviewContainer.classList.add(
                        "active"
                    );

                }


                /* =================================================
                   IMAGE RECEIPT
                ================================================= */

                if (
                    file.type &&
                    file.type.startsWith("image/")
                ) {

                    const imageURL =
                        URL.createObjectURL(file);


                    if (receiptPreview) {

                     receiptPreview.src = imageURL;

                     receiptPreview.alt = "Receipt preview";

                     receiptPreview.removeAttribute("hidden");

                     receiptPreview.style.display = "block";

                     receiptPreview.style.visibility = "visible";

                     receiptPreview.style.opacity = "1";

}

                    if (receiptPreview) {

                        receiptPreview.onload =
                            function () {

                                URL.revokeObjectURL(
                                    imageURL
                                );

                            };

                    }

                }


                /* =================================================
                   PDF RECEIPT
                ================================================= */

                else if (
                    file.type ===
                    "application/pdf"
                ) {

                    if (receiptPreview) {

                        receiptPreview.removeAttribute(
                            "src"
                        );

                        receiptPreview.alt =
                            "PDF receipt selected";

                        receiptPreview.style.display =
                            "none";

                    }

                }


                /* =================================================
                   OTHER FILE
                ================================================= */

                else {

                    if (receiptPreview) {

                        receiptPreview.removeAttribute(
                            "src"
                        );

                        receiptPreview.style.display =
                            "none";

                    }

                }

            }
        );

    }


    /* =====================================================
       REMOVE RECEIPT
    ===================================================== */

    if (removeReceipt) {

        removeReceipt.addEventListener(
            "click",
            function () {

                if (receiptFile) {

                    receiptFile.value =
                        "";

                }


                if (receiptPreview) {

                    receiptPreview.removeAttribute(
                        "src"
                    );

                    receiptPreview.alt =
                        "Receipt preview";

                    receiptPreview.style.display =
                        "";

                }


                if (receiptPreviewContainer) {

                    receiptPreviewContainer.classList.remove(
                        "active"
                    );

                }


                if (receiptFileName) {

                    receiptFileName.textContent =
                        "Receipt";

                }


                if (receiptMessage) {

                    receiptMessage.textContent =
                        "";

                }

            }
        );

    }


    /* =====================================================
       SUBMIT RECEIPT
    ===================================================== */

    if (receiptForm) {

        receiptForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                if (!pendingOrder) {

                    if (receiptMessage) {

                        receiptMessage.textContent =
                            "No pending order was found.";

                    }

                    return;

                }


                if (
                    !receiptFile ||
                    !receiptFile.files ||
                    receiptFile.files.length === 0
                ) {

                    if (receiptMessage) {

                        receiptMessage.textContent =
                            "Please choose your transfer receipt.";

                    }

                    return;

                }


                const file =
                    receiptFile.files[0];


                /* =================================================
                   SAVE RECEIPT
                ================================================= */

                function saveReceipt(receiptData) {

                    pendingOrder.receiptSubmitted =
                        true;


                    pendingOrder.receiptFileName =
                        file.name;


                    pendingOrder.receiptType =
                        file.type;


                    pendingOrder.receiptData =
                        receiptData || "";


                    pendingOrder.paymentMethod =
                        "transfer";


                    pendingOrder.paymentStatus =
                        "awaiting-verification";


                    pendingOrder.status =
                        "processing";


                    /* SAVE PENDING ORDER */

                    localStorage.setItem(
                        "threadlyPendingOrder",
                        JSON.stringify(
                            pendingOrder
                        )
                    );


                    /* SAVE LAST ORDER */

                    localStorage.setItem(
                        "threadlyLastOrder",
                        JSON.stringify(
                            pendingOrder
                        )
                    );


                    /* SAVE PAYMENT STATUS */

                    localStorage.setItem(
                        "threadlyPaymentStatus",
                        "awaiting-verification"
                    );


                    /* =================================================
                       UPDATE ORDERS
                    ================================================= */

                    let orders = [];


                    try {

                        const savedOrders =
                            JSON.parse(
                                localStorage.getItem(
                                    "threadlyOrders"
                                )
                            );


                        if (
                            Array.isArray(
                                savedOrders
                            )
                        ) {

                            orders =
                                savedOrders;

                        }

                    } catch (error) {

                        orders = [];

                    }


                    const orderId =
                        pendingOrder.orderId ||
                        pendingOrder.id ||
                        pendingOrder.orderReference;


                    const existingIndex =
                        orders.findIndex(
                            function (order) {

                                const existingId =
                                    order.orderId ||
                                    order.id ||
                                    order.orderReference;


                                return (
                                    existingId ===
                                    orderId
                                );

                            }
                        );


                    if (
                        existingIndex !== -1
                    ) {

                        orders[existingIndex] =
                            pendingOrder;

                    } else {

                        orders.unshift(
                            pendingOrder
                        );

                    }


                    localStorage.setItem(
                        "threadlyOrders",
                        JSON.stringify(
                            orders
                        )
                    );


                    /* =================================================
                       SUCCESS
                    ================================================= */

                    if (receiptMessage) {

                        receiptMessage.textContent =
                            "Receipt submitted successfully.";

                    }


                    if (submitReceiptButton) {

                        submitReceiptButton.disabled =
                            true;

                        submitReceiptButton.textContent =
                            "RECEIPT SUBMITTED";

                    }


                    setTimeout(
                        function () {

                            window.location.href =
                                "orders.html";

                        },
                        700
                    );

                }


                /* =================================================
                   READ IMAGE RECEIPT
                ================================================= */

                if (
                    file.type &&
                    file.type.startsWith("image/")
                ) {

                    const reader =
                        new FileReader();


                    reader.onload =
                        function (event) {

                            saveReceipt(
                                event.target.result
                            );

                        };


                    reader.onerror =
                        function () {

                            if (receiptMessage) {

                                receiptMessage.textContent =
                                    "The receipt could not be read. Please select it again.";

                            }

                        };


                    reader.readAsDataURL(
                        file
                    );

                }


                /* =================================================
                   PDF RECEIPT
                ================================================= */

                else {

                    saveReceipt("");

                }

            }
        );

    }

})();
/* =========================================================
   THREADLY - DYNAMIC ORDER DETAILS
========================================================= */

(function () {

    const orderNumberElement =
        document.getElementById("detailsOrderNumber");

    if (!orderNumberElement) {
        return;
    }

    /*
        Get selected order number from the URL.

        Example:
        order-details.html?order=THR-1024
    */

    const params = new URLSearchParams(window.location.search);

    const orderNumber =
        params.get("order");

    /*
        Get saved orders
    */

    const orders =
        JSON.parse(
            localStorage.getItem("threadlyOrders") || "[]"
        );

    /*
        Find the selected order
    */

    const order =
        orders.find(function (item) {

            return (
                item.orderNumber === orderNumber ||
                item.id === orderNumber
            );

        });

    /*
        If no order was found,
        keep the page from breaking.
    */

    if (!order) {

        console.log(
            "THREADLY: Order not found:",
            orderNumber
        );

        return;

    }


    /* =====================================================
       ORDER INFORMATION
    ===================================================== */

    const orderNumberDisplay =
        document.getElementById(
            "detailsOrderNumber"
        );

    const orderDate =
        document.getElementById(
            "detailsOrderDate"
        );

    const placedDate =
        document.getElementById(
            "placedDate"
        );


    if (orderNumberDisplay) {

        orderNumberDisplay.textContent =
            "#" +
            (
                order.orderNumber ||
                order.id ||
                ""
            );

    }


    if (orderDate) {

        orderDate.textContent =
            "Placed on " +
            formatOrderDate(
                order.date ||
                order.createdAt
            );

    }


    if (placedDate) {

        placedDate.textContent =
            formatOrderDate(
                order.date ||
                order.createdAt
            );

    }


    /* =====================================================
       PRODUCT INFORMATION
    ===================================================== */

    const productImage =
        document.getElementById(
            "detailsProductImage"
        );

    const productName =
        document.getElementById(
            "detailsProductName"
        );

    const productCategory =
        document.getElementById(
            "detailsProductCategory"
        );

    const productSize =
        document.getElementById(
            "detailsProductSize"
        );

    const productQuantity =
        document.getElementById(
            "detailsProductQuantity"
        );

    const productPrice =
        document.getElementById(
            "detailsProductPrice"
        );


    /*
        Support both:

        order.product

        and

        order.item
    */

    const product =
        order.product ||
        order.item ||
        order;


    if (productName) {

        productName.textContent =
            product.name ||
            "Product";

    }


    if (productCategory) {

        productCategory.textContent =
            (
                product.category ||
                "THREADLY"
            ).toUpperCase();

    }


    if (productSize) {

        productSize.textContent =
            product.size ||
            order.size ||
            "N/A";

    }


    if (productQuantity) {

        productQuantity.textContent =
            product.quantity ||
            order.quantity ||
            1;

    }


    if (productImage) {

        const image =
            product.image ||
            product.imageUrl;

        if (image) {

            productImage.src = image;

        }

    }


    if (productPrice) {

        productPrice.textContent =
            formatMoney(
                product.price ||
                order.price ||
                0
            );

    }


    /* =====================================================
       ORDER TOTAL
    ===================================================== */

    const orderTotal =
        document.getElementById(
            "detailsOrderTotal"
        );


    if (orderTotal) {

        orderTotal.textContent =
            formatMoney(
                order.total ||
                order.orderTotal ||
                product.price ||
                0
            );

    }


    /* =====================================================
       DELIVERY STATUS
    ===================================================== */

    const deliveryStatus =
        order.status ||
        order.deliveryStatus ||
        "processing";


    updateOrderStatus(
        deliveryStatus
    );


    /* =====================================================
       DELIVERY INFORMATION
    ===================================================== */

    const deliveryInformation =
        document.getElementById(
            "detailsDeliveryInformation"
        );

    if (deliveryInformation) {

        deliveryInformation.textContent =
            capitalizeStatus(
                deliveryStatus
            );

    }


    /* =====================================================
       ESTIMATED DELIVERY
    ===================================================== */

    const estimatedDelivery =
        document.getElementById(
            "detailsEstimatedDelivery"
        );

    if (estimatedDelivery) {

        estimatedDelivery.textContent =
            getEstimatedDelivery(
                deliveryStatus,
                order.date ||
                order.createdAt
            );

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function formatMoney(amount) {

        return (
            "₦" +
            Number(amount || 0).toLocaleString(
                "en-NG"
            )
        );

    }


    function formatOrderDate(dateValue) {

        if (!dateValue) {

            return "Date unavailable";

        }

        const date =
            new Date(dateValue);

        if (isNaN(date.getTime())) {

            return dateValue;

        }

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    }


    function capitalizeStatus(status) {

        return String(status)
            .toLowerCase()
            .replace(
                /\b\w/g,
                function (letter) {
                    return letter.toUpperCase();
                }
            );

    }


    function updateOrderStatus(status) {

        const statusElement =
            document.getElementById(
                "detailsDeliveryStatus"
            );

        const trackingMessage =
            document.getElementById(
                "detailsTrackingMessage"
            );


        const cleanStatus =
            String(status)
                .toLowerCase();


        if (statusElement) {

            statusElement.textContent =
                cleanStatus.toUpperCase();

            statusElement.className =
                "delivery-status " +
                cleanStatus;

        }


        if (trackingMessage) {

            const messages = {

                processing:
                    "Your order is being processed",

                shipped:
                    "Your order has been shipped",

                delivered:
                    "Your order has been delivered",

                cancelled:
                    "This order has been cancelled"

            };

            trackingMessage.textContent =
                messages[cleanStatus] ||
                "Your order is being processed";

        }

    }


    function getEstimatedDelivery(
        status,
        dateValue
    ) {

        const cleanStatus =
            String(status)
                .toLowerCase();


        if (cleanStatus === "delivered") {

            return "Delivered";

        }


        if (cleanStatus === "cancelled") {

            return "Cancelled";

        }


        if (!dateValue) {

            return "To be confirmed";

        }


        const date =
            new Date(dateValue);

        if (isNaN(date.getTime())) {

            return "To be confirmed";

        }


        /*
            Standard delivery:
            approximately 3-7 days
        */

        const start =
            new Date(date);

        start.setDate(
            start.getDate() + 3
        );


        const end =
            new Date(date);

        end.setDate(
            end.getDate() + 7
        );


        return (
            formatShortDate(start) +
            " - " +
            formatShortDate(end)
        );

    }


    function formatShortDate(date) {

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    }

})();