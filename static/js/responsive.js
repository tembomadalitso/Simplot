// Responsive Logic for Mobile
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    // Add Mobile Menu Toggle Button to Top Nav
    const topNav = document.querySelector('.top-nav');
    if (topNav) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'btn btn-ghost !p-2 lg:hidden mr-4';
        menuBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
        menuBtn.id = 'mobileMenuBtn';
        topNav.prepend(menuBtn);

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });

    // Handle initial resize
    handleResize();
    window.addEventListener('resize', handleResize);

    function handleResize() {
        if (window.innerWidth <= 1024) {
            mainContent.style.paddingLeft = '0';
            sidebar.classList.remove('collapsed');
        } else {
            const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            mainContent.style.paddingLeft = isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
        }
    }
});
