document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-form');
  const table = document.getElementById('orders-table').getElementsByTagName('tbody')[0];

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const quantity = form.quantity.value.trim();
    const notes = form.notes.value.trim();

    if (!name || !quantity) {
      alert('Nama dan Jumlah wajib diisi.');
      return;
    }

    const newRow = table.insertRow();
    const cellName = newRow.insertCell(0);
    const cellQuantity = newRow.insertCell(1);
    const cellNotes = newRow.insertCell(2);

    cellName.textContent = name;
    cellQuantity.textContent = quantity;
    cellNotes.textContent = notes;

    form.reset();
  });
});
