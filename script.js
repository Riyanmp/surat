/* ============================================
   Persuratan NTB - Script
   ============================================ */

var KEYS = { data: 'dataSurat', logs: 'logsAktivitas' };
var MAX_LOGS = 50;
var MAX_FILE = 2 * 1024 * 1024;
var TOAST_MS = 3500;

function isLoggedIn() {
    return localStorage.getItem('loggedIn') === '1';
}

function getRole() {
    return localStorage.getItem('role') || 'user';
}

function isAdmin() {
    return getRole() === 'admin';
}

function checkAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    addLog('Logout dari akun');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
}

function getUserLabel() {
    var u = localStorage.getItem('username') || '';
    var r = getRole();
    return u + ' (' + r + ')';
}

function getData() {
    return JSON.parse(localStorage.getItem(KEYS.data)) || [];
}

function saveData(d) {
    localStorage.setItem(KEYS.data, JSON.stringify(d));
}

function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Activity Log ── */
function getLogs() {
    return JSON.parse(localStorage.getItem(KEYS.logs)) || [];
}

function addLog(msg) {
    var logs = getLogs();
    logs.unshift({
        msg: msg,
        time: new Date().toISOString(),
        user: localStorage.getItem('username') || '-'
    });
    if (logs.length > MAX_LOGS) logs = logs.slice(0, MAX_LOGS);
    localStorage.setItem(KEYS.logs, JSON.stringify(logs));
}

function logTime(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' +
           d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function fmt(d) {
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

/* ── Toast ── */
function showToast(msg, type) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = escHtml(msg) + '<button class="toast-close" onclick="this.parentElement.className=\'toast\'">&times;</button>';
    el.className = 'toast show ' + (type || 'ok');
    clearTimeout(el._timer);
    el._timer = setTimeout(function() { el.className = 'toast'; }, TOAST_MS);
}

function clearAllData() {
    if (!confirm('Hapus SEMUA data surat?')) return;
    addLog('Menghapus semua data surat');
    localStorage.removeItem(KEYS.data);
    showToast('Data dihapus', 'warn');
    setTimeout(function() { location.reload(); }, 400);
}

function statusBadge(s) {
    if (s === 'ditangani') {
        return '<span class="badge badge-green">Ditangani</span>';
    }
    return '<span class="badge badge-orange">Belum</span>';
}

function fileBadge(nama) {
    if (!nama) return '-';
    return '<span class="badge badge-blue" title="' + escHtml(nama) + '">&#9993; ' + escHtml(nama) + '</span>';
}

function viewFile(i) {
    var data = getData();
    var item = data[i];
    if (!item || !item.fileData) {
        showToast('Tidak ada file', 'err');
        return;
    }
    var win = window.open('');
    if (item.fileName && item.fileName.match(/\.(jpg|jpeg|png)$/i)) {
        win.document.write('<html><head><title>' + escHtml(item.fileName) + '</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#333"><img src="' + item.fileData + '" style="max-width:100%;max-height:100vh"></body></html>');
    } else {
        win.document.write('<html><head><title>' + escHtml(item.fileName) + '</title></head><body style="margin:0"><iframe src="' + item.fileData + '" style="width:100%;height:100vh;border:none"></iframe></body></html>');
    }
}

function fileCol(nama, idx) {
    if (!nama) return '-';
    return '<button class="icon-btn view" onclick="viewFile(' + idx + ')" title="' + escHtml(nama) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>';
}

/* ── Dashboard ── */
function loadDashboard() {
    if (!checkAuth()) return;

    var data = getData();

    document.getElementById('totalSurat').textContent = data.length;

    var ditangani = 0, belum = 0;
    data.forEach(function(item) {
        if (item.status === 'ditangani') ditangani++;
        else belum++;
    });

    document.getElementById('sudahDitangani').textContent = ditangani;
    document.getElementById('belumDitangani').textContent = belum;

    var body = document.getElementById('recentBody');
    var empty = document.getElementById('emptyDash');

    if (!data.length) {
        empty.style.display = 'block';
    } else {
        var recent = data.slice(-5).reverse();
        recent.forEach(function(item, i) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td class="w-center">' + (i + 1) + '</td>' +
                '<td>' + escHtml(item.sumberSurat) + '</td>' +
                '<td>' + escHtml(item.perihal) + '</td>' +
                '<td>' + fmt(item.tanggalSurat) + '</td>' +
                '<td>' + statusBadge(item.status) + '</td>';
        body.appendChild(tr);
    });
    }

    var logs = getLogs();
    var logList = document.getElementById('logList');
    var emptyLog = document.getElementById('emptyLog');

    if (!logs.length) {
        emptyLog.style.display = 'block';
    } else {
        var show = logs.slice(0, 10);
        show.forEach(function(log) {
            var div = document.createElement('div');
            div.className = 'log-item';
            div.innerHTML =
                '<div class="log-msg">' + escHtml(log.msg) + '</div>' +
                '<div class="log-meta">' + escHtml(log.user) + ' &middot; ' + logTime(log.time) + '</div>';
            logList.appendChild(div);
        });
    }
}

/* ── Kalender ── */
var calYear, calMonth;

function initKalender() {
    if (!checkAuth()) return;
    var now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderKalender();
}

function calNav(dir) {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderKalender();
}

function renderKalender() {
    var monthEl = document.getElementById('calMonth');
    monthEl.textContent = MONTH_NAMES[calMonth] + ' ' + calYear;

    var data = getData();
    var dateMap = {};
    data.forEach(function(item) {
        var dates = [item.tanggalSurat, item.tanggalMasuk, item.tanggalTerimaITBAN, item.tanggalTerimaDANIS];
        dates.forEach(function(d) {
            if (!d) return;
            if (!dateMap[d]) dateMap[d] = [];
            dateMap[d].push(item);
        });
    });

    var firstDay = new Date(calYear, calMonth, 1).getDay();
    var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    var container = document.getElementById('calDays');
    container.innerHTML = '';

    for (var i = 0; i < firstDay; i++) {
        var empty = document.createElement('div');
        empty.className = 'cal-cell cal-empty';
        container.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var cell = document.createElement('div');
        cell.className = 'cal-cell';

        if (dateStr === todayStr) cell.classList.add('cal-today');

        var items = dateMap[dateStr] || [];
        var count = items.length;

        var isDitangani = false;
        var isBelum = false;
        items.forEach(function(item) {
            if (item.status === 'ditangani') isDitangani = true;
            else isBelum = true;
        });

        var dots = '';
        if (count > 0) {
            dots = '<div class="cal-dots">';
            if (isDitangani) dots += '<span class="cal-dot green"></span>';
            if (isBelum) dots += '<span class="cal-dot orange"></span>';
            dots += '</div>';
        }

        cell.innerHTML =
            '<div class="cal-date">' + d + '</div>' +
            (count > 0 ? '<div class="cal-count">' + count + '</div>' : '') +
            dots;

        if (count > 0) {
            cell.classList.add('cal-has-data');
            cell.setAttribute('data-date', dateStr);
            cell.addEventListener('click', function() {
                showCalDetail(this.getAttribute('data-date'));
            });
        }

        container.appendChild(cell);
    }

    var totalCells = firstDay + daysInMonth;
    var remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
        for (var j = 0; j < remaining; j++) {
            var emptyEnd = document.createElement('div');
            emptyEnd.className = 'cal-cell cal-empty';
            container.appendChild(emptyEnd);
        }
    }

    showCalDetail(todayStr);
}

function showCalDetail(dateStr) {
    var data = getData();
    var detailDate = document.getElementById('calDetailDate');
    var detailBody = document.getElementById('calDetailBody');
    var empty = document.getElementById('emptyCal');
    var countBadge = document.getElementById('calDetailCount');

    var d = new Date(dateStr + 'T00:00:00');
    detailDate.textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    var items = [];
    data.forEach(function(item, i) {
        if (item.tanggalSurat === dateStr || item.tanggalMasuk === dateStr ||
            item.tanggalTerimaITBAN === dateStr || item.tanggalTerimaDANIS === dateStr) {
            items.push({ item: item, idx: i });
        }
    });

    detailBody.innerHTML = '';

    if (!items.length) {
        empty.style.display = 'block';
        countBadge.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    countBadge.style.display = '';
    countBadge.textContent = items.length + ' surat';

    items.forEach(function(entry, i) {
        var item = entry.item;
        var tr = document.createElement('tr');

        var tglInfo = '';
        if (item.tanggalSurat === dateStr) tglInfo += '<span class="badge badge-blue" style="font-size:7px;margin-right:2px">Tgl Surat</span>';
        if (item.tanggalMasuk === dateStr) tglInfo += '<span class="badge badge-blue" style="font-size:7px;margin-right:2px">Tgl Masuk</span>';
        if (item.tanggalTerimaITBAN === dateStr) tglInfo += '<span class="badge badge-blue" style="font-size:7px;margin-right:2px">Tgl ITBAN</span>';
        if (item.tanggalTerimaDANIS === dateStr) tglInfo += '<span class="badge badge-blue" style="font-size:7px;margin-right:2px">Tgl DANIS</span>';

        tr.innerHTML =
            '<td class="w-center">' + (i + 1) + '</td>' +
            '<td>' + escHtml(item.sumberSurat) + '</td>' +
            '<td>' + escHtml(item.perihal) + '</td>' +
            '<td>' + escHtml(item.nomorSurat) + '</td>' +
            '<td>' + fmt(item.tanggalMasuk) + '</td>' +
            '<td>' + fmt(item.tanggalTerimaITBAN) + '</td>' +
            '<td>' + statusBadge(item.status) + '</td>';

        detailBody.appendChild(tr);
    });
}

/* ── Tracking ── */
function loadTracking() {
    if (!checkAuth()) return;

    var data = getData();

    var totalEl = document.getElementById('trkTotal');
    var selesaiEl = document.getElementById('trkSelesai');
    var prosesEl = document.getElementById('trkProses');
    var selesai = 0, proses = 0;
    data.forEach(function(item) {
        if (item.status === 'ditangani') selesai++;
        else proses++;
    });
    if (totalEl) totalEl.textContent = data.length;
    if (selesaiEl) selesaiEl.textContent = selesai;
    if (prosesEl) prosesEl.textContent = proses;

    renderTracking(data);

    document.getElementById('trkSearch').addEventListener('input', function() {
        renderTracking(data);
    });
}

function renderTracking(data) {
    var listEl = document.getElementById('trackingList');
    var emptyEl = document.getElementById('emptyTrk');
    var countEl = document.getElementById('trkCount');
    var kw = document.getElementById('trkSearch').value.toLowerCase();

    listEl.innerHTML = '';

    var filtered = [];
    data.forEach(function(item, i) {
        var match = !kw ||
            item.sumberSurat.toLowerCase().indexOf(kw) >= 0 ||
            item.perihal.toLowerCase().indexOf(kw) >= 0 ||
            item.nomorSurat.toLowerCase().indexOf(kw) >= 0;
        if (match) filtered.push({ item: item, idx: i });
    });

    countEl.textContent = filtered.length + ' data';

    if (!filtered.length) {
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';

    filtered.forEach(function(entry) {
        var item = entry.item;
        var steps = getTrackingSteps(item);
        var progress = getTrackingProgress(item);

        var div = document.createElement('div');
        div.className = 'trk-card';
        div.innerHTML =
            '<div class="trk-header">' +
                '<div class="trk-info">' +
                    '<div class="trk-source">' + escHtml(item.sumberSurat) + '</div>' +
                    '<div class="trk-subject">' + escHtml(item.perihal) + '</div>' +
                    '<div class="trk-meta">No. ' + escHtml(item.nomorSurat) + ' &middot; ' + fmt(item.tanggalSurat) + '</div>' +
                '</div>' +
                '<div class="trk-progress-info">' +
                    '<span class="trk-pct">' + progress + '%</span>' +
                    statusBadge(item.status) +
                '</div>' +
            '</div>' +
            '<div class="trk-timeline">' +
                '<div class="trk-bar-bg">' +
                    '<div class="trk-bar-fill" style="width:' + progress + '%"></div>' +
                '</div>' +
                '<div class="trk-steps">' +
                    steps.map(function(s) {
                        return '<div class="trk-step' + (s.done ? ' done' : '') + (s.current ? ' current' : '') + '">' +
                            '<div class="trk-dot"></div>' +
                            '<div class="trk-step-label">' + s.label + '</div>' +
                            '<div class="trk-step-date">' + (s.date || '-') + '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
            '</div>';

        listEl.appendChild(div);
    });
}

function getTrackingSteps(item) {
    var steps = [
        { label: 'Surat Masuk', done: !!item.tanggalMasuk, current: false, date: fmt(item.tanggalMasuk) },
        { label: 'Diterima ITBAN', done: !!item.tanggalTerimaITBAN, current: false, date: fmt(item.tanggalTerimaITBAN) },
        { label: 'Diterima DANIS', done: !!item.tanggalTerimaDANIS, current: false, date: fmt(item.tanggalTerimaDANIS) },
        { label: item.status === 'ditangani' ? 'Selesai' : 'Ditangani', done: item.status === 'ditangani', current: item.status !== 'ditangani', date: item.status === 'ditangani' ? 'Selesai' : '-' }
    ];
    return steps;
}

function getTrackingProgress(item) {
    var total = 4;
    var done = 0;
    if (item.tanggalMasuk) done++;
    if (item.tanggalTerimaITBAN) done++;
    if (item.tanggalTerimaDANIS) done++;
    if (item.status === 'ditangani') done++;
    return Math.round(done / total * 100);
}

/* ── Sidebar Mobile ── */
function initSidebar() {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });

    document.addEventListener('click', function(e) {
        if (sidebar.classList.contains('show') && !sidebar.contains(e.target) && !e.target.closest('.btn-menu')) {
            sidebar.classList.remove('show');
        }
    });
}

/* ── Input Page ── */
var editIdx = -1;
var formDirty = false;

function initInputPage() {
    if (!checkAuth()) return;
    if (!isAdmin()) {
        window.location.href = 'data.html';
        return;
    }

    var form = document.getElementById('suratForm');
    var btnSimpan = document.getElementById('btnSimpan');
    var btnBatal = document.getElementById('btnBatal');
    var btnReset = document.getElementById('btnReset');

    form.addEventListener('input', function() { formDirty = true; });

    window.addEventListener('beforeunload', function(e) {
        if (formDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        var fileInput = document.getElementById('fileSurat');
        var file = fileInput.files[0];

        function saveItem(fileData, fileName) {
            var newItem = {
                sumberSurat: document.getElementById('sumberSurat').value.trim(),
                perihal: document.getElementById('perihal').value.trim(),
                nomorSurat: document.getElementById('nomorSurat').value.trim(),
                tanggalSurat: document.getElementById('tanggalSurat').value,
                tanggalMasuk: document.getElementById('tanggalMasuk').value,
                tanggalTerimaITBAN: document.getElementById('tanggalTerimaITBAN').value,
                isiDisposisi: document.getElementById('isiDisposisi').value.trim(),
                tanggalTerimaDANIS: document.getElementById('tanggalTerimaDANIS').value,
                tindakLanjut: document.getElementById('tindakLanjut').value.trim(),
                kendala: document.getElementById('kendala').value.trim(),
                status: 'belum',
                fileName: fileName || '',
                fileData: fileData || ''
            };

            var data = getData();

            if (editIdx >= 0) {
                newItem.status = data[editIdx].status || 'belum';
                if (!fileData && data[editIdx].fileData) {
                    newItem.fileData = data[editIdx].fileData;
                    newItem.fileName = data[editIdx].fileName;
                }
                data[editIdx] = newItem;
                addLog('Mengedit surat dari "' + newItem.sumberSurat + '"');
                showToast('Data diupdate');
            } else {
                data.push(newItem);
                addLog('Menambah surat baru dari "' + newItem.sumberSurat + '"');
                showToast('Data disimpan');
            }

            saveData(data);
            formDirty = false;
            resetForm();
        }

        if (file) {
            if (file.size > MAX_FILE) {
                showToast('Ukuran file maksimal 2MB', 'err');
                return;
            }
            btnSimpan.disabled = true;
            btnSimpan.textContent = 'Menyimpan...';
            var reader = new FileReader();
            reader.onload = function(ev) {
                saveItem(ev.target.result, file.name);
            };
            reader.readAsDataURL(file);
        } else {
            btnSimpan.disabled = true;
            btnSimpan.textContent = 'Menyimpan...';
            saveItem('', '');
        }
    });

    btnBatal.addEventListener('click', resetForm);

    btnReset.addEventListener('click', function() {
        if (confirm('Reset form?')) {
            form.reset();
            editIdx = -1;
            formDirty = false;
            btnSimpan.textContent = 'Simpan';
            btnSimpan.disabled = false;
            btnBatal.style.display = 'none';
        }
    });

    var params = new URLSearchParams(window.location.search);
    var idx = params.get('edit');

    if (idx !== null) {
        var numIdx = parseInt(idx, 10);
        var data = getData();

        if (data[numIdx]) {
            var item = data[numIdx];
            document.getElementById('sumberSurat').value = item.sumberSurat || '';
            document.getElementById('perihal').value = item.perihal || '';
            document.getElementById('nomorSurat').value = item.nomorSurat || '';
            document.getElementById('tanggalSurat').value = item.tanggalSurat || '';
            document.getElementById('tanggalMasuk').value = item.tanggalMasuk || '';
            document.getElementById('tanggalTerimaITBAN').value = item.tanggalTerimaITBAN || '';
            document.getElementById('isiDisposisi').value = item.isiDisposisi || '';
            document.getElementById('tanggalTerimaDANIS').value = item.tanggalTerimaDANIS || '';
            document.getElementById('tindakLanjut').value = item.tindakLanjut || '';
            document.getElementById('kendala').value = item.kendala || '';

            if (item.fileName) {
                document.getElementById('fileSurat').previousElementSibling.innerHTML =
                    'File: <strong>' + escHtml(item.fileName) + '</strong> (biarkan kosong jika tidak diganti)';
            }

            editIdx = numIdx;
            btnSimpan.textContent = 'Update';
            btnBatal.style.display = '';
        }
    }
}

function resetForm() {
    document.getElementById('suratForm').reset();
    editIdx = -1;
    formDirty = false;
    document.getElementById('btnSimpan').textContent = 'Simpan';
    document.getElementById('btnSimpan').disabled = false;
    document.getElementById('btnBatal').style.display = 'none';
    window.location.href = 'data.html';
}

/* ── Data Page ── */
var filteredData = [];
var currentFilter = '';

function initDataPage() {
    if (!checkAuth()) return;

    var data = getData();

    var totalEl = document.getElementById('totalSurat');
    var ditanganiEl = document.getElementById('sudahDitangani');
    var belumEl = document.getElementById('belumDitangani');
    if (totalEl) {
        totalEl.textContent = data.length;
        var ditangani = 0, belum = 0;
        data.forEach(function(item) {
            if (item.status === 'ditangani') ditangani++;
            else belum++;
        });
        ditanganiEl.textContent = ditangani;
        belumEl.textContent = belum;
    }

    var params = new URLSearchParams(window.location.search);
    currentFilter = params.get('filter') || '';

    refreshTable();

    document.getElementById('searchInput').addEventListener('input', filterData);

    if (isAdmin()) {
        document.getElementById('btnDeleteAll').style.display = '';
    } else {
        document.getElementById('btnDeleteAll').style.display = 'none';
        var inputBtn = document.querySelector('.header-btn');
        if (inputBtn) inputBtn.style.display = 'none';
    }
}

function refreshTable() {
    var data = getData();
    var kw = document.getElementById('searchInput').value.toLowerCase();

    filteredData = [];
    data.forEach(function(item, i) {
        var matchStatus = !currentFilter || (item.status || 'belum') === currentFilter;
        var matchSearch = !kw ||
            item.sumberSurat.toLowerCase().indexOf(kw) >= 0 ||
            item.perihal.toLowerCase().indexOf(kw) >= 0 ||
            item.nomorSurat.toLowerCase().indexOf(kw) >= 0 ||
            (item.tindakLanjut && item.tindakLanjut.toLowerCase().indexOf(kw) >= 0);

        if (matchStatus && matchSearch) {
            filteredData.push({ item: item, idx: i });
        }
    });

    renderTable();
}

function filterData() {
    refreshTable();
}

function renderTable() {
    var body = document.getElementById('suratBody');
    var empty = document.getElementById('emptyTable');
    var count = document.getElementById('dataCount');

    body.innerHTML = '';

    if (!filteredData.length) {
        count.textContent = '0 data';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    count.textContent = filteredData.length + ' data';

    var seq = 0;
    filteredData.forEach(function(entry) {
        var item = entry.item;
        var ri = entry.idx;
        var tr = document.createElement('tr');
        var admin = isAdmin();
        seq++;

        tr.innerHTML =
            '<td class="w-center">' + seq + '</td>' +
            '<td>' + escHtml(item.sumberSurat) + '</td>' +
            '<td>' + escHtml(item.perihal) + '</td>' +
            '<td>' + escHtml(item.nomorSurat) + '</td>' +
            '<td>' + fmt(item.tanggalSurat) + '</td>' +
            '<td>' + fmt(item.tanggalMasuk) + '</td>' +
            '<td>' + fmt(item.tanggalTerimaITBAN) + '</td>' +
            '<td>' + escHtml(item.isiDisposisi || '-') + '</td>' +
            '<td>' + fmt(item.tanggalTerimaDANIS) + '</td>' +
            '<td>' + escHtml(item.tindakLanjut || '-') + '</td>' +
            '<td>' + escHtml(item.kendala || '-') + '</td>' +
            '<td>' + fileCol(item.fileName, ri) + '</td>' +
            (admin ?
                '<td class="cell-aksi">' +
                    '<button class="icon-btn edit" onclick="editData(' + ri + ')" title="Edit">&#9998;</button> ' +
                    '<button class="icon-btn hapus" onclick="delData(' + ri + ')" title="Hapus">&#10005;</button>' +
                '</td>' +
                '<td class="cell-status">' +
                    '<button class="status-btn status-' + item.status + '" onclick="toggleStatus(' + ri + ')" title="Klik untuk ganti status">' + statusBadge(item.status) + '</button>' +
                '</td>'
            :
                '<td class="cell-aksi">-</td>' +
                '<td class="cell-status">' + statusBadge(item.status) + '</td>'
            );

        body.appendChild(tr);
    });
}

function toggleStatus(i) {
    var data = getData();
    var item = data[i];
    var oldStatus = item.status === 'ditangani' ? 'Belum Ditangani' : 'Ditangani';
    item.status = (item.status === 'ditangani') ? 'belum' : 'ditangani';
    var newStatus = item.status === 'ditangani' ? 'Ditangani' : 'Belum Ditangani';
    saveData(data);
    addLog('Mengubah status "' + item.sumberSurat + '" dari ' + oldStatus + ' ke ' + newStatus);
    refreshTable();
    showToast('Status diubah');
}

function editData(i) {
    window.location.href = 'input.html?edit=' + i;
}

function delData(i) {
    if (!confirm('Hapus data ini?')) return;
    var data = getData();
    addLog('Menghapus surat dari "' + data[i].sumberSurat + '"');
    data.splice(i, 1);
    saveData(data);
    refreshTable();
    showToast('Data dihapus', 'warn');
}

/* ── Cetak Data ── */
function cetakData() {
    var data = getData();
    if (!data.length) {
        showToast('Tidak ada data untuk dicetak', 'err');
        return;
    }

    var rows = '';
    data.forEach(function(item, i) {
        rows += '<tr>' +
            '<td style="text-align:center">' + (i + 1) + '</td>' +
            '<td>' + escHtml(item.sumberSurat || '-') + '</td>' +
            '<td>' + escHtml(item.perihal || '-') + '</td>' +
            '<td>' + escHtml(item.nomorSurat || '-') + '</td>' +
            '<td style="text-align:center">' + fmt(item.tanggalSurat) + '</td>' +
            '<td style="text-align:center">' + fmt(item.tanggalMasuk) + '</td>' +
            '<td style="text-align:center">' + fmt(item.tanggalTerimaITBAN) + '</td>' +
            '<td>' + escHtml(item.isiDisposisi || '-') + '</td>' +
            '<td style="text-align:center">' + fmt(item.tanggalTerimaDANIS) + '</td>' +
            '<td>' + escHtml(item.tindakLanjut || '-') + '</td>' +
            '<td>' + escHtml(item.kendala || '-') + '</td>' +
            '<td style="text-align:center">' + (item.status === 'ditangani' ? 'Ditangani' : 'Belum') + '</td>' +
            '</tr>';
    });

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<title>Data Surat - ITBAN IV Inspektorat NTB</title>' +
        '<style>' +
        '*{margin:0;padding:0;box-sizing:border-box}' +
        'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;padding:20px}' +
        '.header-print{text-align:center;margin-bottom:16px;border-bottom:2px solid #0D47A1;padding-bottom:12px}' +
        '.header-print h1{font-size:16px;color:#0D47A1;margin-bottom:2px}' +
        '.header-print h2{font-size:13px;font-weight:normal;color:#333;margin-bottom:2px}' +
        '.header-print p{font-size:10px;color:#666}' +
        'table{width:100%;border-collapse:collapse;margin-top:10px}' +
        'th{background:#0D47A1;color:#fff;padding:6px 5px;text-align:left;font-size:10px;border:1px solid #0D47A1}' +
        'td{padding:5px;border:1px solid #ccc;font-size:10px;vertical-align:top}' +
        'tr:nth-child(even){background:#f5f8fc}' +
        '.footer-print{margin-top:14px;text-align:right;font-size:10px;color:#666;border-top:1px solid #ccc;padding-top:6px}' +
        '@media print{body{padding:10mm} .no-print{display:none}}' +
        '</style></head><body>' +
        '<div class="header-print">' +
        '<h1>Inspektorat Provinsi NTB</h1>' +
        '<h2>Ruangan ITBAN IV - Data Surat Masuk</h2>' +
        '<p>Dicetak: ' + new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) + ' | Total: ' + data.length + ' data</p>' +
        '</div>' +
        '<table><thead><tr>' +
        '<th style="width:30px;text-align:center">#</th>' +
        '<th>Sumber</th>' +
        '<th>Perihal</th>' +
        '<th>Nomor</th>' +
        '<th>Tgl Surat</th>' +
        '<th>Tgl Masuk</th>' +
        '<th>Tgl ITBAN</th>' +
        '<th>Disposisi</th>' +
        '<th>Tgl DANIS</th>' +
        '<th>Tindak Lanjut</th>' +
        '<th>Kendala</th>' +
        '<th style="width:60px;text-align:center">Status</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="footer-print">Halaman cetak &mdash; Sistem Persuratan ITBAN IV Inspektorat Provinsi NTB</div>' +
        '<script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script>' +
        '</body></html>';

    var win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

/* ── Laporan ── */
var MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function loadLaporan() {
    if (!checkAuth()) return;

    var data = getData();

    var totalEl = document.getElementById('rptTotal');
    var ditanganiEl = document.getElementById('rptDitangani');
    var belumEl = document.getElementById('rptBelum');
    var d = 0, b = 0;
    if (totalEl) {
        totalEl.textContent = data.length;
        data.forEach(function(item) {
            if (item.status === 'ditangani') d++; else b++;
        });
        ditanganiEl.textContent = d;
        belumEl.textContent = b;
    }

    if (!data.length) return;

    /* ── Donut Chart ── */
    var donutWrap = document.getElementById('donutWrap');
    var emptyDonut = document.getElementById('emptyDonut');
    if (donutWrap && data.length > 0) {
        donutWrap.style.display = '';
        emptyDonut.style.display = 'none';
        var pctD = data.length > 0 ? Math.round(d / data.length * 100) : 0;
        var deg = Math.round(pctD * 3.6);
        var donutEl = document.getElementById('donutChart');
        var centerEl = document.getElementById('donutCenter');
        donutEl.style.background = 'conic-gradient(#2e7d32 0deg ' + deg + 'deg, #e65100 ' + deg + 'deg 360deg)';
        centerEl.textContent = pctD + '%';
        document.getElementById('donutDitangani').textContent = d;
        document.getElementById('donutBelum').textContent = b;
    }

    /* ── Monthly Bar Chart ── */
    var monthly = {};
    data.forEach(function(item) {
        var dt = item.tanggalMasuk || item.tanggalSurat;
        if (!dt) return;
        var key = dt.substring(0, 7);
        if (!monthly[key]) monthly[key] = { total: 0, ditangani: 0, belum: 0 };
        monthly[key].total++;
        if (item.status === 'ditangani') monthly[key].ditangani++;
        else monthly[key].belum++;
    });

    var sortedKeys = Object.keys(monthly).sort().reverse();

    var maxTotal = 0;
    sortedKeys.forEach(function(k) {
        if (monthly[k].total > maxTotal) maxTotal = monthly[k].total;
    });

    var chartEl = document.getElementById('chartBulanan');
    var emptyChart = document.getElementById('emptyChart');
    if (sortedKeys.length === 0) {
        emptyChart.style.display = 'block';
    } else {
        sortedKeys.forEach(function(k) {
            var m = monthly[k];
            var pct = maxTotal > 0 ? (m.total / maxTotal * 100) : 0;
            var pctGreen = m.total > 0 ? (m.ditangani / m.total * 100) : 0;
            var label = MONTH_NAMES[parseInt(k.split('-')[1], 10) - 1] + ' ' + k.split('-')[0];

            var div = document.createElement('div');
            div.className = 'chart-row';
            div.innerHTML =
                '<div class="chart-label">' + label + '</div>' +
                '<div class="chart-track">' +
                    '<div class="chart-fill" style="width:' + pct + '%"></div>' +
                    '<div class="chart-fill-green" style="width:' + (pct * pctGreen / 100) + '%"></div>' +
                '</div>' +
                '<div class="chart-val">' + m.total + '</div>';
            chartEl.appendChild(div);
        });
    }

    /* ── Top Sumber ── */
    var sumberCount = {};
    data.forEach(function(item) {
        var s = item.sumberSurat || '-';
        sumberCount[s] = (sumberCount[s] || 0) + 1;
    });

    var sorted = Object.keys(sumberCount).sort(function(a, b) {
        return sumberCount[b] - sumberCount[a];
    });

    var topEl = document.getElementById('topSumber');
    var emptyTop = document.getElementById('emptyTop');
    var topItems = sorted.slice(0, 8);

    if (!topItems.length) {
        emptyTop.style.display = 'block';
    } else {
        var maxSumber = sumberCount[topItems[0]] || 1;
        topItems.forEach(function(s, i) {
            var c = sumberCount[s];
            var pct = (c / maxSumber * 100);
            var medals = ['&#179;', '&#178;', '&#185;'];
            var medal = i < 3 ? '<span class="top-medal">' + medals[i] + '</span>' : '<span class="top-rank">' + (i + 1) + '</span>';

            var div = document.createElement('div');
            div.className = 'top-row';
            div.innerHTML =
                '<div class="top-left">' + medal + '<span class="top-name">' + escHtml(s) + '</span></div>' +
                '<div class="top-right"><span class="top-count">' + c + ' surat</span></div>';
            topEl.appendChild(div);
        });
    }

    /* ── Year Distribution ── */
    var yearCount = {};
    data.forEach(function(item) {
        var dt = item.tanggalMasuk || item.tanggalSurat;
        if (!dt) return;
        var y = dt.substring(0, 4);
        yearCount[y] = (yearCount[y] || 0) + 1;
    });

    var yearKeys = Object.keys(yearCount).sort();
    var yearEl = document.getElementById('yearBars');
    var emptyYear = document.getElementById('emptyYear');
    var maxYear = 0;
    yearKeys.forEach(function(y) {
        if (yearCount[y] > maxYear) maxYear = yearCount[y];
    });

    if (!yearKeys.length) {
        emptyYear.style.display = 'block';
    } else {
        yearEl.style.display = '';
        emptyYear.style.display = 'none';
        var colors = ['#0D47A1','#1565C0','#1976D2','#1E88E5','#42A5F5'];
        yearKeys.forEach(function(y, i) {
            var c = yearCount[y];
            var pct = maxYear > 0 ? (c / maxYear * 100) : 0;
            var color = colors[i % colors.length];

            var div = document.createElement('div');
            div.className = 'year-row';
            div.innerHTML =
                '<div class="year-label">' + y + '</div>' +
                '<div class="year-track">' +
                    '<div class="year-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
                '</div>' +
                '<div class="year-val">' + c + '</div>';
            yearEl.appendChild(div);
        });
    }

    /* ── Rekap Table ── */
    var rekapBody = document.getElementById('rekapBody');
    sortedKeys.forEach(function(k) {
        var m = monthly[k];
        var pct = m.total > 0 ? Math.round(m.ditangani / m.total * 100) : 0;
        var barColor = pct >= 80 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
        var label = MONTH_NAMES[parseInt(k.split('-')[1], 10) - 1] + ' ' + k.split('-')[0];

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="font-weight:600">' + label + '</td>' +
            '<td style="text-align:center">' + m.total + '</td>' +
            '<td style="text-align:center">' + m.ditangani + '</td>' +
            '<td style="text-align:center">' + m.belum + '</td>' +
            '<td>' +
                '<div class="progress-wrap">' +
                    '<div class="progress-bar" style="width:' + pct + '%;background:' + barColor + '"></div>' +
                    '<span class="progress-text">' + pct + '%</span>' +
                '</div>' +
            '</td>';
        rekapBody.appendChild(tr);
    });
}

/* ── Profil ── */
var USERS_KEY = 'usersData';
var DEFAULT_USERS = {
    admin: { password: 'admin123', role: 'admin' },
    user: { password: 'user123', role: 'user' }
};

function getUsers() {
    var stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return JSON.parse(JSON.stringify(DEFAULT_USERS));
}

function saveUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function loadProfil() {
    if (!checkAuth()) return;

    var username = localStorage.getItem('username') || '';
    var role = getRole();
    var data = getData();
    var users = getUsers();

    document.getElementById('profileAvatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = username;
    document.getElementById('profileRole').textContent = role === 'admin' ? 'Administrator' : 'User';
    document.getElementById('profileUser').textContent = username;
    document.getElementById('profileRoleText').textContent = role === 'admin' ? 'Administrator (Akses Penuh)' : 'User (Hanya Lihat)';
    document.getElementById('profileTotal').textContent = data.length + ' surat';

    var lastLogin = localStorage.getItem('lastLogin');
    if (lastLogin) {
        document.getElementById('profileLastLogin').textContent = logTime(lastLogin);
    } else {
        document.getElementById('profileLastLogin').textContent = '-';
    }

    localStorage.setItem('lastLogin', new Date().toISOString());

    var passForm = document.getElementById('passForm');
    passForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var lama = document.getElementById('passLama').value;
        var baru = document.getElementById('passBaru').value;
        var konf = document.getElementById('passKonf').value;

        if (!users[username]) {
            showToast('User tidak ditemukan', 'err');
            return;
        }

        if (users[username].password !== lama) {
            showToast('Password lama salah', 'err');
            return;
        }

        if (baru.length < 4) {
            showToast('Password baru minimal 4 karakter', 'err');
            return;
        }

        if (baru !== konf) {
            showToast('Konfirmasi password tidak cocok', 'err');
            return;
        }

        users[username].password = baru;
        saveUsers(users);
        addLog('Mengganti password akun');
        passForm.reset();
        showToast('Password berhasil diganti');
    });
}
