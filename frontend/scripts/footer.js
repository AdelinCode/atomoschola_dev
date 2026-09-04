// Injects the shared site footer into any element with id="site-footer"
(function () {
    const html = `
    <footer class="site-footer">
        <div class="footer-inner">
            <div class="footer-brand">
                <div class="footer-brand-name">
                    <i class="fas fa-atom"></i>
                    Atomo Schola
                </div>
                <p class="footer-brand-desc">A collaborative educational platform for quality STEM and Humanities content.</p>
                <div class="footer-social">
                    <a href="https://discord.gg/vM87v8mspN" target="_blank" title="Discord"><i class="fab fa-discord"></i></a>
                    <a href="https://www.instagram.com/atomoschola_official/" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Explore</div>
                <a href="index.html"><i class="fas fa-chevron-right"></i> Home</a>
                <a href="stem.html"><i class="fas fa-chevron-right"></i> STEM</a>
                <a href="humanities.html"><i class="fas fa-chevron-right"></i> Humanities</a>
                <a href="search.html"><i class="fas fa-chevron-right"></i> Search</a>
                <a href="archive.html"><i class="fas fa-chevron-right"></i> Problem Archive</a>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Community</div>
                <a href="staff.html"><i class="fas fa-chevron-right"></i> Contributors</a>
                <a href="team.html"><i class="fas fa-chevron-right"></i> Team</a>
                <a href="social.html"><i class="fas fa-chevron-right"></i> Social</a>
                <a href="events.html"><i class="fas fa-chevron-right"></i> Events</a>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Platform</div>
                <a href="news.html"><i class="fas fa-chevron-right"></i> News</a>
                <a href="how-it-works.html"><i class="fas fa-chevron-right"></i> How AS Works</a>
                <a href="propose-edits.html"><i class="fas fa-chevron-right"></i> Propose Edits</a>
                <a href="terms.html"><i class="fas fa-chevron-right"></i> Terms of Use</a>
                <a href="privacy.html"><i class="fas fa-chevron-right"></i> Privacy Policy</a>
                <a href="register.html"><i class="fas fa-chevron-right"></i> Register</a>
            </div>
        </div>
        <div class="footer-bottom">
            <span class="footer-bottom-copy">&copy; 2026-2027 Atomo Schola. All rights reserved.</span>
            <span class="footer-bottom-credit">Created by <a href="https://github.com/HojdaAdelin" target="_blank">Hojda Adelin</a> &amp; <a href="https://github.com/Andy15ro" target="_blank">Lazar Andrei</a></span>
        </div>
    </footer>`;

    const el = document.getElementById('site-footer');
    if (el) el.outerHTML = html;
})();
