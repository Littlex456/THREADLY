
// =========================================
// THREADLY AUTH GUARD
// Protects customer pages that require login
// =========================================

(function () {

    const LOGIN_PAGE = "login.html";

    // =========================================
    // PAGES THAT REQUIRE LOGIN
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
        "order-details.html",
        "index.html"
    ];


    // =========================================
    // GET CURRENT PAGE
    // =========================================

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";


    // =========================================
    // LOAD SUPABASE CLIENT
    // =========================================

    function getSupabaseClient() {
        return window.threadlySupabase || null;
    }


    // =========================================
    // CHECK LOGIN
    // =========================================

    async function checkLogin() {

        const db = getSupabaseClient();

        if (!db) {
            console.error(
                "THREADLY: Supabase client was not found."
            );

            return false;
        }

        try {

            const {
                data,
                error
            } = await db.auth.getSession();

            if (error) {
                console.error(
                    "THREADLY: Could not check session.",
                    error
                );

                return false;
            }

            return !!data.session;

        } catch (error) {

            console.error(
                "THREADLY: Authentication check failed.",
                error
            );

            return false;
        }
    }


    // =========================================
    // REDIRECT TO LOGIN
    // =========================================

    function redirectToLogin() {

        const requestedPage =
            window.location.pathname.split("/").pop() +
            window.location.search;

        const redirectURL =
            LOGIN_PAGE +
            "?redirect=" +
            encodeURIComponent(requestedPage);

        window.location.replace(redirectURL);
    }


    // =========================================
    // PROTECT CURRENT PAGE
    // =========================================

    async function protectPage() {

        if (!protectedPages.includes(currentPage)) {
            return;
        }

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            redirectToLogin();
            return;
        }

        // Tell the rest of THREADLY that the user is logged in
        window.threadlyLoggedIn = true;

        localStorage.setItem(
            "threadlyLoggedIn",
            "true"
        );
    }


    // =========================================
    // REQUIRE LOGIN FOR ACTIONS
    // =========================================

    window.threadlyRequireLogin = async function () {

        const loggedIn = await checkLogin();

        if (!loggedIn) {

            redirectToLogin();

            return false;
        }

        return true;
    };


    // =========================================
    // CHECK LOGIN STATUS
    // =========================================

    window.threadlyIsLoggedIn = async function () {

        return await checkLogin();

    };


    // =========================================
    // SUPABASE ACCESS
    // =========================================

    window.threadlyGetSupabase = function () {

        return getSupabaseClient();

    };


    // =========================================
    // AUTH STATE CHANGES
    // =========================================

    function watchAuthState() {

        const db = getSupabaseClient();

        if (!db) {
            return;
        }

        db.auth.onAuthStateChange(function (
            event,
            session
        ) {

            if (session) {

                window.threadlyLoggedIn = true;

                localStorage.setItem(
                    "threadlyLoggedIn",
                    "true"
                );

            } else {

                window.threadlyLoggedIn = false;

                localStorage.removeItem(
                    "threadlyLoggedIn"
                );

                localStorage.removeItem(
                    "threadlyUser"
                );

                // If the user is currently on
                // a protected page, send them to login

                if (protectedPages.includes(currentPage)) {

                    redirectToLogin();

                }

            }

        });

    }


    // =========================================
    // PROTECT AGAINST BROWSER BACK BUTTON
    // =========================================

    window.addEventListener(
        "pageshow",
        async function (event) {

            if (
                event.persisted &&
                protectedPages.includes(currentPage)
            ) {

                const loggedIn = await checkLogin();

                if (!loggedIn) {

                    redirectToLogin();

                }

            }

        }
    );


    // =========================================
    // PROTECT LINKS TO CUSTOMER PAGES
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

            // Ignore external links
            if (
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                href.startsWith("#") ||
                href.startsWith("mailto:")
            ) {
                return;
            }

            const targetPage =
                href.split("?")[0].split("#")[0];

            if (
                !protectedPages.includes(targetPage)
            ) {
                return;
            }

            const loggedIn = await checkLogin();

            if (!loggedIn) {

                event.preventDefault();

                const redirectURL =
                    LOGIN_PAGE +
                    "?redirect=" +
                    encodeURIComponent(href);

                window.location.replace(
                    redirectURL
                );

            }

        }
    );


    // =========================================
    // NO-CACHE FOR PROTECTED PAGES
    // =========================================

    if (protectedPages.includes(currentPage)) {

        const meta1 =
            document.createElement("meta");

        meta1.setAttribute(
            "http-equiv",
            "Cache-Control"
        );

        meta1.setAttribute(
            "content",
            "no-store, no-cache, must-revalidate, max-age=0"
        );

        document.head.appendChild(meta1);


        const meta2 =
            document.createElement("meta");

        meta2.setAttribute(
            "http-equiv",
            "Pragma"
        );

        meta2.setAttribute(
            "content",
            "no-cache"
        );

        document.head.appendChild(meta2);


        const meta3 =
            document.createElement("meta");

        meta3.setAttribute(
            "http-equiv",
            "Expires"
        );

        meta3.setAttribute(
            "content",
            "0"
        );

        document.head.appendChild(meta3);

    }


    // =========================================
    // START AUTH GUARD
    // =========================================

    async function startAuthGuard() {

        // Wait briefly for supabase-client.js
        // to become available

        let attempts = 0;

        while (
            !window.threadlySupabase &&
            attempts < 50
        ) {

            await new Promise(function (resolve) {

                setTimeout(resolve, 100);

            });

            attempts++;

        }


        const db = getSupabaseClient();

        if (!db) {

            console.error(
                "THREADLY: Supabase client unavailable."
            );

            return;
        }


        // Check current page first
        await protectPage();


        // Then watch future login/logout changes
        watchAuthState();

    }


    // =========================================
    // RUN
    // =========================================

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startAuthGuard
        );

    } else {

        startAuthGuard();

    }

})();
