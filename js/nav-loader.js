// Esegui quando il contenuto HTML è stato caricato
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. IL TUO UNICO POSTO DA MODIFICARE ---
    // Definisci qui tutti i link della tua navigazione.
    // I link (href) sono RELATIVI ALLA CARTELLA PRINCIPALE (root)
    const navItems = [
        { text: "Home", href: "index.html" },
        { text: "Homework 1", href: "pages/hw1.html" },
        { text: "Homework 2", href: "pages/hw2.html" },
        { text: "Homework 3", href: "pages/hw3.html" },
        { text: "Homework 4", href: "pages/hw4.html" },
        { text: "Homework 5", href: "pages/hw5.html" },
        { text: "Homework 6", href: "pages/hw6.html" },
        { text: "Homework 7", href: "pages/hw7.html" },
        // Per aggiungere HW8:
        { text: "Homework 8", href: "pages/hw8.html" }
    ];

    // --- 2. Logica di Costruzione (non toccare) ---

    // Trova il segnaposto
    const sidebarPlaceholder = document.getElementById("sidebar-placeholder");
    if (!sidebarPlaceholder) {
        console.error("Errore: Elemento 'sidebar-placeholder' non trovato.");
        return;
    }

    // Controlla se siamo in una sottocartella (es. /pages/)
    // Questo determina se usare "../" per i percorsi
    const isPagesDirectory = window.location.pathname.includes("/pages/");
    const rootPath = isPagesDirectory ? "../" : "";

    // Trova la pagina corrente per impostarla come "active"
    const currentPage = window.location.pathname.split('/').pop();

    // Costruisci l'HTML della navigazione
    let navHtml = '<h2>Navigation</h2><nav><ul>';

    navItems.forEach(item => {
        const itemHref = item.href;
        const finalHref = rootPath + itemHref;
        
        // Controlla se questo è il link della pagina corrente
        const isActive = (itemHref.endsWith(currentPage));
        const activeClass = isActive ? 'class="active"' : '';

        navHtml += `
            <li>
                <a href="${finalHref}" ${activeClass}>
                    ${item.text}
                </a>
            </li>
        `;
    });

    navHtml += '</ul></nav>';

    // Inserisci l'HTML nel segnaposto
    sidebarPlaceholder.innerHTML = navHtml;
});