// Use the page's footer slot when present, or render at the script location.
(function () {
    const html = `
    <footer class="site-footer">
        <div class="footer-inner">
            <div class="footer-brand">
                <div class="footer-brand-name">
                    <i class="fas fa-atom" aria-hidden="true"></i>
                    Atomo Schola
                </div>
                <p class="footer-brand-desc">A collaborative educational platform for quality STEM and Humanities content.</p>
                <div class="footer-social">
                    <a href="https://discord.gg/vM87v8mspN" target="_blank" rel="noopener noreferrer" title="Discord"><i class="fab fa-discord"></i></a>
                    <a href="https://www.instagram.com/atomoschola_official/" target="_blank" rel="noopener noreferrer" title="Instagram"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Explore</div>
                <a href="index.html">Home</a>
                <a href="stem.html">STEM</a>
                <a href="humanities.html">Humanities</a>
                <a href="search.html">Search</a>
                <a href="archive.html">Problem Archive</a>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Community</div>
                <a href="staff.html">Contributors</a>
                <a href="team.html">Team</a>
                <a href="social.html">Social</a>
                <a href="events.html">Events</a>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Platform</div>
                <a href="news.html">News</a>
                <a href="how-it-works.html">How AS Works</a>
                <a href="propose-edits.html">Propose Edits</a>
                <a href="terms.html">Terms of Use</a>
                <a href="privacy.html">Privacy Policy</a>
                <a href="register.html">Register</a>
            </div>
        </div>
        <div class="footer-bottom">
            <span class="footer-bottom-copy">&copy; 2026 Atomo Schola. All rights reserved.</span>
            <div class="footer-bottom-credits">
                <span class="footer-bottom-credit">Website Created by <a href="https://github.com/HojdaAdelin" target="_blank" rel="noopener noreferrer">Hojda Adelin</a> &amp; <a href="https://github.com/Andy15ro" target="_blank" rel="noopener noreferrer">Lazar Andrei</a></span>
                <span class="footer-bottom-credit">Made by Atomo Schola Team</span>
            </div>
        </div>
    </footer>`;

    const el = document.getElementById('site-footer');
    if (el) el.outerHTML = html;
    else document.currentScript.insertAdjacentHTML('beforebegin', html);
})();
