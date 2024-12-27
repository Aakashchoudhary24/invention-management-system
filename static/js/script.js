document.addEventListener('DOMContentLoaded', function () {
    // Store the data globally so we can filter it
    const dataStore = {
        inventions: [],
        inventors: [],
        awards: [],
        juries: []
    };

    // Tab Navigation
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // Search functionality
    function setupSearch(section) {
        const searchInputs = document.querySelectorAll(`#${section} .search-field`);
        searchInputs.forEach(input => {
            input.addEventListener('input', () => filterData(section));
        });
    }

    function filterData(section) {
        const searchInputs = document.querySelectorAll(`#${section} .search-field`);
        const searchTerms = {};
        
        // Collect all search terms
        searchInputs.forEach(input => {
            const fields = input.dataset.search.split(',');
            fields.forEach(field => {
                searchTerms[field] = input.value.toLowerCase();
            });
        });

        // Filter the data
        const filteredData = dataStore[section].filter(item => {
            return Object.entries(searchTerms).every(([field, term]) => {
                if (!term) return true; // Skip empty search terms
                
                // Handle combined fields (like first name + last name)
                if (field.includes(',')) {
                    const fields = field.split(',');
                    const combinedValue = fields.map(f => item[f]).join(' ').toLowerCase();
                    return combinedValue.includes(term);
                }
                
                // Handle regular fields
                const value = String(item[field] || '').toLowerCase();
                return value.includes(term);
            });
        });

        // Render the filtered data
        renderData(section, filteredData);
    }

    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    function renderData(section, data) {
        const grid = document.getElementById(`${section}-grid`);
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<div class="no-results">No matching results found</div>';
            return;
        }

        const searchInputs = document.querySelectorAll(`#${section} .search-field`);
        const searchTerms = {};
        searchInputs.forEach(input => {
            if (input.value) {
                const fields = input.dataset.search.split(',');
                fields.forEach(field => {
                    searchTerms[field] = input.value.toLowerCase();
                });
            }
        });

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Create card content based on section
            switch(section) {
                case 'inventions':
                    card.innerHTML = createInventionCard(item, searchTerms);
                    break;
                case 'inventors':
                    card.innerHTML = createInventorCard(item, searchTerms);
                    break;
                case 'awards':
                    card.innerHTML = createAwardCard(item, searchTerms);
                    break;
                case 'juries':
                    card.innerHTML = createJuryCard(item, searchTerms);
                    break;
            }
            
            grid.appendChild(card);
        });
    }

    function createInventionCard(invention, searchTerms) {
        return `
            <div class="card-header">
                <h3 class="card-title mb-0">${highlightText(invention.invention_name, searchTerms.invention_name)}</h3>
                <small class="text-muted">ID: ${invention.invention_id}</small>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p class="data-label">Category</p>
                        <p class="data-value">${highlightText(invention.invention_category, searchTerms.invention_category)}</p>
                    </div>
                    <div class="col-6">
                        <p class="data-label">Year</p>
                        <p class="data-value">${highlightText(String(invention.year_of_invention), searchTerms.year_of_invention)}</p>
                    </div>
                    <div class="col-6">
                        <p class="data-label">Award Status</p>
                        <p class="data-value">${highlightText(invention.nomination_status || 'Not Nominated', searchTerms.nomination_status)}</p>
                    </div>
                    <div class="col-6">
                        <p class="data-label">Inventors</p>
                        <p class="data-value">${highlightText(invention.inventor_names || 'No Inventors', searchTerms.inventor_names)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    function createInventorCard(inventor, searchTerms) {
        return `
            <div class="card-header">
                <h3 class="card-title mb-0">${highlightText(`${inventor.inventor_fname} ${inventor.inventor_lname}`, searchTerms['inventor_fname,inventor_lname'])}</h3>
                <small class="text-muted">ID: ${inventor.inventor_id}</small>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p class="data-label">Job Type</p>
                        <p class="data-value">${highlightText(inventor.job_type, searchTerms.job_type)}</p>
                    </div>
                    <div class="col-6">
                        <p class="data-label">Date of Birth</p>
                        <p class="data-value">${highlightText(inventor.dob, searchTerms.dob)}</p>
                    </div>
                    <div class="col-12">
                        <p class="data-label">Inventions</p>
                        <p class="data-value">${highlightText(inventor.inventions || 'No Inventions', searchTerms.inventions)}</p>
                    </div>
                    <div class="col-12">
                        <p class="data-label">Awards</p>
                        <p class="data-value">${highlightText(inventor.awards || 'No Awards', searchTerms.awards)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    function createAwardCard(award, searchTerms) {
        return `
            <div class="card-header">
                <h3 class="card-title mb-0">${highlightText(award.award_name, searchTerms.award_name)}</h3>
                <small class="text-muted">ID: ${award.award_id}</small>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p class="data-label">Category</p>
                        <p class="data-value">${highlightText(award.award_category, searchTerms.award_category)}</p>
                    </div>
                    <div class="col-6">
                        <p class="data-label">Jury</p>
                        <p class="data-value">${highlightText(award.jury_name, searchTerms.jury_name)}</p>
                    </div>
                    <div class="col-12">
                        <p class="data-label">Nominated Inventions</p>
                        <p class="data-value">${highlightText(award.nominated_inventions || 'No Nominations', searchTerms.nominated_inventions)}</p>
                    </div>
                    <div class="col-12">
                        <p class="data-label">Nomination Statuses</p>
                        <p class="data-value">${highlightText(award.nomination_statuses || 'No Statuses', searchTerms.nomination_statuses)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    function createJuryCard(jury, searchTerms) {
        return `
            <div class="card-header">
                <h3 class="card-title mb-0">${highlightText(jury.jury_name, searchTerms.jury_name)}</h3>
                <small class="text-muted">ID: ${jury.jury_id}</small>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p class="data-label">Start Year</p>
                        <p class="data-value">${highlightText(String(jury.start_year), searchTerms.start_year)}</p>
                    </div>
                    <div class="col-6">
                        <p class="data-label">End Year</p>
                        <p class="data-value">${highlightText(String(jury.end_year), searchTerms.end_year)}</p>
                    </div>
                    <div class="col-12">
                        <p class="data-label">Managed Awards</p>
                        <p class="data-value">${highlightText(jury.managed_awards || 'No Awards', searchTerms.managed_awards)}</p>
                    </div>
                    <div class="col-12">
                        <p class="data-label">Nominations Judged</p>
                        <p class="data-value">${highlightText(String(jury.nominations_judged || 0), searchTerms.nominations_judged)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Fetch and initialize data
    function fetchAndInitialize(endpoint, section) {
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                dataStore[section] = data[section];
                renderData(section, data[section]);
                setupSearch(section);
            })
            .catch(error => console.error(`Error fetching ${section}:`, error));
    }

    // Initialize all sections
    fetchAndInitialize('/api/inventions', 'inventions');
    fetchAndInitialize('/api/inventors', 'inventors');
    fetchAndInitialize('/api/awards', 'awards');
    fetchAndInitialize('/api/juries', 'juries');
});