// Render before the shared navigation and search scripts read the header.
document.currentScript.insertAdjacentHTML('beforebegin', `
    <header class="header atomo-site-header">
        <div class="header-content">
            <div class="logo">
                <a href="index.html">
                    <img src="logo.jpeg" alt="Atomo Schola">
                    <span>Atomo Schola</span>
                </a>
            </div>

            <div class="search-bar">
                <input type="text" aria-label="Search for lessons, topics" placeholder="Search for lessons, topics..." id="searchInput">
                <button class="search-btn" aria-label="Search">
                    <i class="fas fa-search"></i>
                </button>
            </div>

            <nav class="nav-menu" id="navMenu" aria-label="Main navigation">
            </nav>
            <button class="nav-hamburger" id="navHamburger" aria-label="Open menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    </header>
`);
