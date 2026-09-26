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

        if (
            window.threadlySupabase
        ) {

            return window.threadlySupabase;

        }


        if (
            !window.supabase
        ) {

            await loadScript(
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
            );

        }


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
                    await supabase.auth.getSession();


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
                    data.session?.user || null;


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


            event.preventDefault();


            const loggedIn =
                await isLoggedIn();


            if (loggedIn) {

                window.location.href =
                    href;

                return;

            }


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


    function getSystemTheme() {

        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            return "dark";
        }

        return "light";
    }


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


        localStorage.setItem(
            THEME_KEY,
            selectedTheme
        );


        updateThemeControls(
            selectedTheme
        );

    }


    window.threadlyApplyTheme =
        function (theme) {

            applyTheme(theme);

        };


    window.threadlyGetTheme =
        function () {

            return getSavedTheme();

        };


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


            if (password.length < 8) {

                signupMessage.textContent =
                    "Your password must be at least 8 characters long.";

                return;
            }


            if (!/[A-Z]/.test(password)) {

                signupMessage.textContent =
                    "Your password must contain at least one capital letter (A-Z).";

                return;
            }


            if (password !== confirmPassword) {

                signupMessage.textContent =
                    "The passwords do not match. Please enter the same password in both fields.";

                return;
            }


            let supabase;

            try {

                supabase =
                    await window.threadlyGetSupabase();

            } catch (error) {

                console.error(
                    "THREADLY Supabase client was not found:",
                    error
                );

                signupMessage.textContent =
                    "Authentication service is unavailable.";

                return;

            }


            if (!supabase) {

                signupMessage.textContent =
                    "Authentication service is unavailable.";

                return;

            }


            signupMessage.textContent =
                "Creating your account...";


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


            if (error) {

                console.error(
                    "THREADLY signup error:",
                    error
                );

                signupMessage.textContent =
                    error.message;

                return;
            }


            if (!data.user) {

                signupMessage.textContent =
                    "Account could not be created.";

                return;
            }


            localStorage.setItem(
                "threadlyUser",
                JSON.stringify({

                    name: name,

                    email: email,

                    phone: phone,

                    username: username

                })
            );


            await supabase.auth.signOut();


            localStorage.removeItem(
                "threadlyLoggedIn"
            );


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


            if (!email || !password) {

                loginMessage.textContent =
                    "Please enter your email and password.";

                return;
            }


            let supabase;

            try {

                supabase =
                    await window.threadlyGetSupabase();

            } catch (error) {

                console.error(
                    "THREADLY Supabase client was not found:",
                    error
                );

                loginMessage.textContent =
                    "Authentication service is unavailable.";

                return;

            }


            if (!supabase) {

                loginMessage.textContent =
                    "Authentication service is unavailable.";

                return;

            }


            loginMessage.textContent =
                "Signing you in...";


            const { data, error } =
                await supabase.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                console.error(
                    "THREADLY login error:",
                    error
                );

                loginMessage.textContent =
                    "Incorrect email or password.";

                return;
            }


            if (!data.session || !data.user) {

                loginMessage.textContent =
                    "Login could not be completed.";

                return;
            }


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

            window.location.href =
                "shop.html";

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
        document.querySelector(
            ".shop-page"
        );


    if (!shopPage) return;


    // =========================================
    // SUPABASE PRODUCT DATABASE
    // =========================================

    async function loadProductsFromSupabase() {

        try {

            if (
                !window.threadlyGetSupabase
            ) {

                console.warn(
                    "THREADLY Supabase helper is not available."
                );

                return;

            }


            const supabase =
                await window.threadlyGetSupabase();


            if (!supabase) {

                return;

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("products")
                    .select(
                        `
                        id,
                        name,
                        category,
                        filter_category,
                        price,
                        image,
                        in_stock,
                        quantity,
                        description,
                        sizes
                        `
                    )
                    .order(
                        "created_at",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                console.error(
                    "THREADLY product database error:",
                    error
                );

                return;

            }


            if (!Array.isArray(data)) {

                return;

            }


            Object.keys(
                products
            ).forEach(
                function (id) {

                    delete products[id];

                }
            );


            data.forEach(
                function (item) {

                    products[item.id] = {

                        id:
                            item.id,

                        name:
                            item.name,

                        category:
                            item.category,

                        filterCategory:
                            item.filter_category,

                        price:
                            Number(
                                item.price
                            ),

                        image:
                            item.image,

                        inStock:
                            item.in_stock === true,

                        quantity:
                            Number(
                                item.quantity
                            ) || 0,

                        description:
                            item.description ||
                            "",

                        sizes:
                            Array.isArray(
                                item.sizes
                            )
                                ? item.sizes
                                : []

                    };

                }
            );


            renderShopProducts();

            applyShopFilters();


            console.log(
                "THREADLY products loaded from Supabase."
            );


        } catch (error) {

            console.error(
                "THREADLY product loading failed:",
                error
            );

        }

    }


    // =========================================
    // SHOP ELEMENTS
    // =========================================

    let productCards =
        document.querySelectorAll(
            ".shop-products .shop-product-card"
        );


    const searchInput =
        document.getElementById(
            "shopSearch"
        );


    const searchButton =
        document.getElementById(
            "shopSearchButton"
        );


    const filterButtons =
        document.querySelectorAll(
            ".shop-controls .filters button[data-filter]"
        );


    const filterToggle =
        document.getElementById(
            "filterToggle"
        );


    const filterPanel =
        document.getElementById(
            "filterPanel"
        );


    const filterClose =
        document.getElementById(
            "filterClose"
        );


    const applyFiltersButton =
        document.getElementById(
            "applyFilters"
        );


    const clearFiltersButton =
        document.getElementById(
            "clearFilters"
        );


    const minPrice =
        document.getElementById(
            "filterMinPrice"
        );


    const maxPrice =
        document.getElementById(
            "filterMaxPrice"
        );


    const minPriceValue =
        document.getElementById(
            "filterMinPriceValue"
        );


    const maxPriceValue =
        document.getElementById(
            "filterMaxPriceValue"
        );


    const sortSelect =
        document.getElementById(
            "filterSort"
        );


    const stockCheckbox =
        document.getElementById(
            "filterInStock"
        );


    let activeCategory =
        "all";


    let activeSearch =
        "";


    // =========================================
    // RENDER SHOP PRODUCTS
    // =========================================

    function renderShopProducts() {

        const grid =
            document.querySelector(
                ".shop-product-grid"
            );


        if (!grid) {

            return;

        }


        grid.innerHTML =
            "";


        Object.entries(
            products
        ).forEach(
            function ([id, product]) {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "shop-product-card product-link";


                card.dataset.category =
                    product.filterCategory ||
                    "";


                card.dataset.name =
                    product.name ||
                    "";


                card.innerHTML = `

                    <a
                        href="product.html?id=${id}"
                        class="shop-product-image"
                    >

                        <img
                            src="${product.image}"
                            alt="${product.name}"
                        >

                    </a>


                    <div class="shop-product-info">

                        <p class="product-category">
                            ${product.category}
                        </p>

                        <h2>
                            ${product.name}
                        </h2>

                        <p class="product-price">
                            ₦${Number(
                                product.price
                            ).toLocaleString("en-NG")}
                        </p>

                    </div>

                `;


                grid.appendChild(
                    card
                );

            }
        );


        productCards =
            document.querySelectorAll(
                ".shop-products .shop-product-card"
            );

    }


    // =========================================
    // GET PRODUCT ID FROM CARD
    // =========================================

    function getShopProductId(card) {

        if (!card) {

            return null;

        }


        const link =
            card.querySelector(
                'a[href*="product.html?id="]'
            );


        if (!link) {

            return null;

        }


        const href =
            link.getAttribute(
                "href"
            );


        if (!href) {

            return null;

        }


        try {

            const url =
                new URL(
                    href,
                    window.location.href
                );


            return url.searchParams.get(
                "id"
            );

        } catch (error) {

            return null;

        }

    }


    // =========================================
    // GET PRICE
    // =========================================

    function getProductPrice(product) {

        return Number(
            product?.price || 0
        );

    }


    // =========================================
    // NO RESULTS MESSAGE
    // =========================================

    function updateShopNoResults(
        visibleCards
    ) {

        let noResults =
            document.getElementById(
                "shopNoResults"
            );


        if (!noResults) {

            noResults =
                document.createElement(
                    "div"
                );


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


    // =========================================
    // APPLY SHOP FILTERS
    // =========================================

    function applyShopFilters() {

        const search =
            activeSearch.toLowerCase();


        const min =
            minPrice
                ? Number(
                    minPrice.value || 0
                )
                : 0;


        const max =
            maxPrice
                ? Number(
                    maxPrice.value ||
                    100000
                )
                : 100000;


        const stockOnly =
            stockCheckbox
                ? stockCheckbox.checked
                : false;


        const selectedClothingSizes =
            Array.from(
                document.querySelectorAll(
                    'input[name="clothingSize"]:checked'
                )
            ).map(
                function (input) {

                    return input.value;

                }
            );


        const selectedShoeSizes =
            Array.from(
                document.querySelectorAll(
                    'input[name="shoeSize"]:checked'
                )
            ).map(
                function (input) {

                    return input.value;

                }
            );


        const selectedSizes = [
            ...selectedClothingSizes,
            ...selectedShoeSizes
        ];


        const selectedCategories =
            Array.from(
                document.querySelectorAll(
                    'input[name="filterCategory"]:checked'
                )
            ).map(
                function (input) {

                    return input.value.toLowerCase();

                }
            );


        let visibleCards =
            [];


        productCards.forEach(
            function (card) {

                const productId =
                    getShopProductId(
                        card
                    );


                const product =
                    products[
                        productId
                    ];


                if (!product) {

                    card.style.display =
                        "none";

                    return;

                }


                const productCategory =
                    (
                        product.filterCategory ||
                        ""
                    ).toLowerCase();


                let matchesCategory =
                    activeCategory ===
                    "all";


                if (
                    activeCategory !==
                    "all"
                ) {

                    matchesCategory =
                        productCategory ===
                        activeCategory;

                }


                if (
                    selectedCategories.length
                    > 0
                ) {

                    matchesCategory =
                        selectedCategories.includes(
                            productCategory
                        );

                }


                const searchableText =
                    (
                        product.name +
                        " " +
                        product.category +
                        " " +
                        product.filterCategory +
                        " " +
                        product.description
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const matchesPrice =
                    getProductPrice(
                        product
                    ) >= min &&
                    getProductPrice(
                        product
                    ) <= max;


                let matchesSize =
                    true;


                if (
                    selectedSizes.length
                    > 0
                ) {

                    matchesSize =
                        Array.isArray(
                            product.sizes
                        ) &&
                        product.sizes.some(
                            function (size) {

                                return selectedSizes.includes(
                                    String(size)
                                );

                            }
                        );

                }


                const matchesStock =
                    !stockOnly ||
                    product.inStock === true;


                const shouldShow =
                    matchesCategory &&
                    matchesSearch &&
                    matchesPrice &&
                    matchesSize &&
                    matchesStock;


                card.style.display =
                    shouldShow
                        ? ""
                        : "none";


                if (
                    shouldShow
                ) {

                    visibleCards.push({
                        card:
                            card,

                        product:
                            product
                    });

                }

            }
        );


        // =========================================
        // SORT
        // =========================================

        if (
            sortSelect &&
            visibleCards.length
        ) {

            const sort =
                sortSelect.value;


            visibleCards.sort(
                function (a, b) {

                    if (
                        sort ===
                        "price-low"
                    ) {

                        return (
                            getProductPrice(
                                a.product
                            ) -
                            getProductPrice(
                                b.product
                            )
                        );

                    }


                    if (
                        sort ===
                        "price-high"
                    ) {

                        return (
                            getProductPrice(
                                b.product
                            ) -
                            getProductPrice(
                                a.product
                            )
                        );

                    }


                    return 0;

                }
            );


            const grid =
                document.querySelector(
                    ".shop-product-grid"
                );


            if (grid) {

                visibleCards.forEach(
                    function (item) {

                        grid.appendChild(
                            item.card
                        );

                    }
                );

            }

        }


        updateShopNoResults(
            visibleCards.length
        );

    }


    // =========================================
    // CATEGORY BUTTONS
    // =========================================

    filterButtons.forEach(
        function (button) {

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


                    button.classList.add(
                        "active"
                    );


                    activeCategory =
                        (
                            button.dataset.filter ||
                            "all"
                        ).toLowerCase();


                    applyShopFilters();

                }
            );

        }
    );


    // =========================================
    // SEARCH
    // =========================================

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

                if (
                    event.key ===
                    "Enter"
                ) {

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


    // =========================================
    // FILTER PANEL
    // =========================================

    if (
        filterToggle &&
        filterPanel
    ) {

        filterToggle.addEventListener(
            "click",
            function () {

                filterPanel.classList.toggle(
                    "active"
                );

            }
        );

    }


    if (
        filterClose &&
        filterPanel
    ) {

        filterClose.addEventListener(
            "click",
            function () {

                filterPanel.classList.remove(
                    "active"
                );

            }
        );

    }


    // =========================================
    // PRICE DISPLAY
    // =========================================

    function updatePriceLabels() {

        if (
            minPriceValue &&
            minPrice
        ) {

            minPriceValue.textContent =
                "₦" +
                Number(
                    minPrice.value
                ).toLocaleString("en-NG");

        }


        if (
            maxPriceValue &&
            maxPrice
        ) {

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
            function () {

                if (
                    Number(
                        minPrice.value
                    ) >
                    Number(
                        maxPrice?.value ||
                        100000
                    )
                ) {

                    if (maxPrice) {

                        minPrice.value =
                            maxPrice.value;

                    }

                }


                updatePriceLabels();

            }
        );

    }


    if (maxPrice) {

        maxPrice.addEventListener(
            "input",
            function () {

                if (
                    Number(
                        maxPrice.value
                    ) <
                    Number(
                        minPrice?.value ||
                        0
                    )
                ) {

                    if (minPrice) {

                        maxPrice.value =
                            minPrice.value;

                    }

                }


                updatePriceLabels();

            }
        );

    }


    // =========================================
    // APPLY FILTER BUTTON
    // =========================================

    if (
        applyFiltersButton
    ) {

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


    // =========================================
    // CLEAR FILTERS
    // =========================================

    if (
        clearFiltersButton
    ) {

        clearFiltersButton.addEventListener(
            "click",
            function () {

                activeCategory =
                    "all";


                activeSearch =
                    "";


                if (searchInput) {

                    searchInput.value =
                        "";

                }


                if (minPrice) {

                    minPrice.value =
                        minPrice.min ||
                        0;

                }


                if (maxPrice) {

                    maxPrice.value =
                        maxPrice.max ||
                        100000;

                }


                if (stockCheckbox) {

                    stockCheckbox.checked =
                        false;

                }


                document
                    .querySelectorAll(
                        'input[name="filterCategory"], input[name="clothingSize"], input[name="shoeSize"]'
                    )
                    .forEach(
                        function (input) {

                            input.checked =
                                false;

                        }
                    );


                if (sortSelect) {

                    sortSelect.value =
                        "default";

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


    if (stockCheckbox) {

        stockCheckbox.addEventListener(
            "change",
            applyShopFilters
        );

    }


    // =========================================
    // READ SEARCH / CATEGORY FROM URL
    // =========================================

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlSearch =
        params.get(
            "search"
        );


    const urlCategory =
        params.get(
            "category"
        );


    if (urlSearch) {

        activeSearch =
            urlSearch.trim();


        if (searchInput) {

            searchInput.value =
                activeSearch;

        }

    }


    if (
        urlCategory &&
        [
            "all",
            "men",
            "women",
            "shoes"
        ].includes(
            urlCategory.toLowerCase()
        )
    ) {

        activeCategory =
            urlCategory.toLowerCase();


        filterButtons.forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    (
                        button.dataset.filter ||
                        ""
                    ).toLowerCase() ===
                    activeCategory
                );

            }
        );

    }


    // =========================================
    // INITIAL SHOP RENDER
    // =========================================

    renderShopProducts();

    updatePriceLabels();

    applyShopFilters();


    // =========================================
    // LOAD REAL PRODUCTS
    // =========================================

    loadProductsFromSupabase();

})();


// =========================================
// SECTION 8: PRODUCT PAGE
// =========================================

(async function () {

    const productPage =
        document.querySelector(".product-page");

    if (!productPage) return;


    const params =
        new URLSearchParams(
            window.location.search
        );


    const productId =
        params.get("id");


    if (!productId) {
        return;
    }


    // =========================================
    // LOAD LATEST PRODUCT DATA
    // =========================================

    let product =
        products[productId];


    try {

        if (
            typeof window.threadlyGetSupabase ===
            "function"
        ) {

            const supabase =
                await window.threadlyGetSupabase();


            if (supabase) {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("products")
                        .select(
                            `
                            id,
                            name,
                            category,
                            filter_category,
                            price,
                            image,
                            in_stock,
                            quantity,
                            description,
                            sizes
                            `
                        )
                        .order(
                            "created_at",
                            {
                                ascending: true
                            }
                        );


                if (error) {

                    console.error(
                        "THREADLY product page database error:",
                        error
                    );

                } else if (
                    Array.isArray(data)
                ) {

                    Object.keys(
                        products
                    ).forEach(
                        function (id) {

                            delete products[id];

                        }
                    );


                    data.forEach(
                        function (item) {

                            products[item.id] = {

                                id:
                                    item.id,

                                name:
                                    item.name,

                                category:
                                    item.category,

                                filterCategory:
                                    item.filter_category,

                                price:
                                    Number(
                                        item.price
                                    ),

                                image:
                                    item.image,

                                inStock:
                                    item.in_stock === true,

                                quantity:
                                    Number(
                                        item.quantity
                                    ) || 0,

                                description:
                                    item.description ||
                                    "",

                                sizes:
                                    Array.isArray(
                                        item.sizes
                                    )
                                        ? item.sizes
                                        : []

                            };

                        }
                    );


                    product =
                        products[productId];

                }

            }

        }

    } catch (error) {

        console.error(
            "THREADLY product page loading failed:",
            error
        );

    }


    // =========================================
    // CHECK PRODUCT
    // =========================================

    if (!product) {
        return;
    }


    // =========================================
    // PRODUCT ELEMENTS
    // =========================================

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


    // =========================================
    // PRODUCT INFORMATION
    // =========================================

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


    // =========================================
    // PRODUCT IMAGE
    // =========================================

    if (productImage) {

        productImage.src =
            product.image;

        productImage.alt =
            product.name;

        productImage.onerror =
            function () {

                this.style.display =
                    "none";

            };

    }


    // =========================================
    // THUMBNAIL
    // =========================================

    if (thumbnails && productImage) {

        thumbnails.innerHTML = "";


        const thumbnail =
            document.createElement("button");


        thumbnail.type =
            "button";


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


    // =========================================
    // SIZE SELECTION
    // =========================================

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


                button.type =
                    "button";


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

        currentSize =
            "One size";


        if (sizeSection) {

            sizeSection.style.display =
                "none";

        }

    }


    // =========================================
    // QUANTITY
    // =========================================

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


    // =========================================
    // CART STORAGE
    // =========================================

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


    // =========================================
    // ADD TO CART
    // =========================================

    if (addToCartButton) {

        addToCartButton.addEventListener(
            "click",
            async function () {

                if (
                    typeof window.threadlyRequireLogin ===
                    "function"
                ) {

                    const loggedIn =
                        await window.threadlyRequireLogin();


                    if (!loggedIn) {

                        return;

                    }

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

                        id:
                            productId,

                        name:
                            product.name,

                        price:
                            product.price,

                        image:
                            product.image,

                        size:
                            currentSize ||
                            "One size",

                        quantity:
                            quantity

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


    // =========================================
    // SAVED ITEMS
    // =========================================

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


    // =========================================
    // RELATED PRODUCTS
    // =========================================

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

    const STANDARD_DELIVERY =
        2500;


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


    function formatPrice(price) {

        return "₦" +
            Number(price || 0)
                .toLocaleString("en-NG");

    }


    function renderCart() {

        const cart =
            getCart();


        if (!cartContainer) return;


        cartContainer.innerHTML = "";


        if (!cart.length) {

            if (cartEmpty) {

                cartEmpty.style.display =
                    "block";

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

                checkoutButton.disabled =
                    true;

            }


            return;

        }


        if (cartEmpty) {

            cartEmpty.style.display =
                "none";

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

            checkoutButton.disabled =
                false;

        }

    }


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                const cart =
                    getCart();


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

    const STANDARD_DELIVERY =
        2500;

    const EXPRESS_DELIVERY =
        4500;


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


    function formatPrice(price) {

        return "₦" +
            Number(price || 0)
                .toLocaleString("en-NG");

    }


    function getSelectedDelivery() {

        const selected =
            document.querySelector(
                'input[name="deliveryMethod"]:checked'
            );


        return selected
            ? selected.value
            : "standard";

    }


    function getDeliveryFee() {

        return getSelectedDelivery() === "express"
            ? EXPRESS_DELIVERY
            : STANDARD_DELIVERY;

    }


    function updateCheckoutTotal() {

        const cart =
            getCart();


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


    function renderCheckoutItems() {

        const cart =
            getCart();


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


    deliveryOptions.forEach(function (option) {

        option.addEventListener(
            "change",
            updateCheckoutTotal
        );

    });


    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const cart =
                    getCart();


                if (!cart.length) {

                    alert(
                        "Your cart is empty."
                    );

                    return;

                }


                const loggedIn =
                    await window.threadlyRequireLogin();


                if (!loggedIn) {

                    return;

                }


                const supabase =
                    await window.threadlyGetSupabase();


                if (!supabase) {

                    console.error(
                        "THREADLY: Supabase is not available."
                    );

                    alert(
                        "Unable to connect to the database. Please try again."
                    );

                    return;

                }


                const {
                    data: userData,
                    error: userError
                } =
                    await supabase.auth.getUser();


                if (
                    userError ||
                    !userData ||
                    !userData.user
                ) {

                    console.error(
                        "THREADLY user error:",
                        userError
                    );

                    alert(
                        "Please log in before placing your order."
                    );

                    return;

                }


                const user =
                    userData.user;


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


                const orderNumber =
                    "THR-" +
                    Date.now()
                        .toString()
                        .slice(-6);


                const orderItems =
                    cart.map(function (item) {

                        return {

                            id:
                                item.id,

                            name:
                                item.name,

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

                    });


                const now =
                    new Date()
                        .toISOString();


                const {
                    error: orderError
                } =
                    await supabase
                        .from("orders")
                        .insert({

                            id:
                                orderNumber,

                            order_number:
                                orderNumber,

                            customer_full_name:
                                customer.name,

                            customer_email:
                                customer.email,

                            customer_phone:
                                customer.phone,

                            customer_address:
                                customer.address,

                            customer_state:
                                customer.state,

                            customer_city:
                                customer.city,

                            items:
                                orderItems,

                            subtotal:
                                subtotal,

                            delivery:
                                deliveryFee,

                            delivery_method:
                                delivery,

                            total:
                                total,

                            payment_status:
                                "pending-verification",

                            payment_method:
                                "",

                            delivery_status:
                                "processing",

                            receipt_url:
                                "",

                            estimated_delivery:
                                delivery === "express"
                                    ? "1-3 days"
                                    : "3-7 days",

                            created_at:
                                now,

                            updated_at:
                                now,

                            user_id:
                                user.id

                        });


                if (orderError) {

                    console.error(
                        "THREADLY order database error:",
                        orderError
                    );

                    alert(
                        "Your order could not be saved. Please try again."
                    );

                    return;

                }


                const pendingOrder = {

                    id:
                        orderNumber,

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
                        orderItems,

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


                localStorage.setItem(
                    "threadlyPendingOrder",
                    JSON.stringify(
                        pendingOrder
                    )
                );


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


                window.location.href =
                    "payment-method.html";

            }
        );

    }


    renderCheckoutItems();

    updateCheckoutTotal();

})();

// =========================================
// ACCOUNT PAGE
// =========================================

(async function () {

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


    const accountPhone =
        document.getElementById(
            "accountPhone"
        );


    const accountUsername =
        document.getElementById(
            "accountUsername"
        );


    const accountRole =
        document.getElementById(
            "accountRole"
        );


    try {

        const supabase =
            await window.threadlyGetSupabase();


        if (!supabase) {

            console.error(
                "THREADLY Supabase client is unavailable."
            );

            return;

        }


        const {
            data: userData,
            error: userError
        } =
            await supabase.auth.getUser();


        if (
            userError ||
            !userData.user
        ) {

            console.error(
                "THREADLY account user could not be loaded:",
                userError
            );

            return;

        }


        const user =
            userData.user;


        const {
            data: profile,
            error: profileError
        } =
            await supabase
                .from("profiles")
                .select(
                    "full_name, phone, username, role"
                )
                .eq(
                    "id",
                    user.id
                )
                .single();


        if (profileError) {

            console.error(
                "THREADLY profile could not be loaded:",
                profileError
            );

            return;

        }


        const fullName =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            "THREADLY Customer";


        const phone =
            profile?.phone ||
            user.user_metadata?.phone ||
            "";


        const username =
            profile?.username ||
            user.user_metadata?.username ||
            "";


        const role =
            profile?.role ||
            "customer";


        const email =
            user.email ||
            "";


        if (accountName) {

            accountName.textContent =
                fullName;

        }


        if (accountFullName) {

            accountFullName.textContent =
                fullName;

        }


        if (accountEmail) {

            accountEmail.textContent =
                email;

        }


        if (accountPhone) {

            accountPhone.textContent =
                phone;

        }


        if (accountUsername) {

            accountUsername.textContent =
                username;

        }


        if (accountRole) {

            accountRole.textContent =
                role;

        }


        localStorage.setItem(
            "threadlyUser",
            JSON.stringify({

                name:
                    fullName,

                email:
                    email,

                phone:
                    phone,

                username:
                    username

            })
        );


    } catch (error) {

        console.error(
            "THREADLY account page error:",
            error
        );

    }

})();


// =========================================
// SECTION 12: LOGOUT
// =========================================

(function () {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    const mobileLogout =
        document.getElementById(
            "mobileLogout"
        );


    async function logoutUser(event) {

        if (event) {

            event.preventDefault();

        }


        const supabase =
            window.threadlySupabase;


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


        localStorage.removeItem(
            "threadlyLoggedIn"
        );


        localStorage.removeItem(
            "threadlyUser"
        );


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


// =========================================
// SECTION 13: MOBILE MENU
// =========================================

(function () {

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const closeMenu =
        document.getElementById(
            "closeMenu"
        );


    const mobileMenu =
        document.getElementById(
            "mobileMenu"
        );


    const menuOverlay =
        document.getElementById(
            "menuOverlay"
        );


    if (!menuButton || !mobileMenu) {

        return;

    }


    function openMenu() {

        mobileMenu.classList.add(
            "active"
        );


        if (menuOverlay) {

            menuOverlay.classList.add(
                "active"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    function closeMobileMenu() {

        mobileMenu.classList.remove(
            "active"
        );


        if (menuOverlay) {

            menuOverlay.classList.remove(
                "active"
            );

        }


        document.body.style.overflow =
            "";

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


// =========================================
// SECTION 14: SAVED ITEMS
// =========================================

(function () {

    const savedContainer =
        document.getElementById(
            "savedItems"
        );


    if (!savedContainer) {

        return;

    }


    let savedItems = [];


    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    "threadlySaved"
                )
            );


        if (Array.isArray(saved)) {

            savedItems =
                saved;

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


    async function loadSavedProducts() {

        if (savedItems.length === 0) {

            renderSavedItems([]);

            return;

        }


        try {

            if (
                typeof window.threadlyGetSupabase !==
                "function"
            ) {

                renderSavedItems([]);

                return;

            }


            const supabase =
                await window.threadlyGetSupabase();


            if (!supabase) {

                renderSavedItems([]);

                return;

            }


            const productIds =
                savedItems
                    .map(function (item) {

                        return getProductId(item);

                    })
                    .filter(Boolean);


            const {
                data,
                error
            } =
                await supabase
                    .from("products")
                    .select(`
                        id,
                        name,
                        category,
                        filter_category,
                        price,
                        image,
                        in_stock,
                        quantity,
                        description,
                        sizes
                    `)
                    .in("id", productIds);


            if (error) {

                console.error(
                    "THREADLY saved items database error:",
                    error
                );

                renderSavedItems([]);

                return;

            }


            if (!Array.isArray(data)) {

                renderSavedItems([]);

                return;

            }


            renderSavedItems(data);

        } catch (error) {

            console.error(
                "THREADLY saved items loading failed:",
                error
            );

            renderSavedItems([]);

        }

    }


    function renderSavedItems(databaseProducts) {

        savedContainer.innerHTML =
            "";


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
                databaseProducts.find(
                    function (databaseProduct) {

                        return (
                            databaseProduct.id ===
                            productId
                        );

                    }
                );


            if (!product) {

                return;

            }


            const card =
                document.createElement(
                    "article"
                );


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
                            ₦${Number(
                                product.price
                            ).toLocaleString("en-NG")}
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


            savedContainer.appendChild(
                card
            );

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
                        JSON.stringify(
                            savedItems
                        )
                    );


                    loadSavedProducts();

                }
            );

        });


        const savedCount =
            document.getElementById(
                "savedItemCount"
            );


        if (savedCount) {

            const visibleItems =
                savedContainer.querySelectorAll(
                    ".shop-product-card"
                ).length;


            savedCount.textContent =
                visibleItems === 1
                    ? "1 item"
                    : `${visibleItems} items`;

        }

    }


    loadSavedProducts();

})();

// =========================================
// SECTION 15: PAYMENT METHOD
// =========================================

(function () {

    const paymentPage =
        document.querySelector(
            ".payment-method-page"
        );


    if (!paymentPage) {

        return;

    }


    const orderSummary =
        document.getElementById(
            "paymentOrderSummary"
        );


    const paymentAmount =
        document.getElementById(
            "paymentAmount"
        );


    const paymentMessage =
        document.getElementById(
            "paymentMessage"
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

                        paymentMessage.textContent =
                            "";

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


// =========================================
// SECTION 16: BANK TRANSFER
// =========================================

(function () {

    const transferPage =
        document.querySelector(
            ".transfer-page"
        );


    if (!transferPage) {

        return;

    }


    const transferAmount =
        document.getElementById(
            "transferAmount"
        );


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


    if (transferAmount) {

        transferAmount.textContent =
            formatNaira(
                pendingOrder.total
            );

    }


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


// =========================================
// THREADLY - DYNAMIC ORDER DETAILS
// =========================================

(function () {

    const orderNumberElement =
        document.getElementById(
            "detailsOrderNumber"
        );


    if (!orderNumberElement) {

        return;

    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const orderNumber =
        params.get("order");


    const orders =
        JSON.parse(
            localStorage.getItem(
                "threadlyOrders"
            ) || "[]"
        );


    const order =
        orders.find(function (item) {

            return (
                item.orderNumber ===
                    orderNumber ||
                item.id ===
                    orderNumber
            );

        });


    if (!order) {

        console.log(
            "THREADLY: Order not found:",
            orderNumber
        );

        return;

    }


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

            productImage.src =
                image;

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


    const deliveryStatus =
        order.status ||
        order.deliveryStatus ||
        "processing";


    updateOrderStatus(
        deliveryStatus
    );


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