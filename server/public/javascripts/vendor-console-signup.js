document.querySelector('form').addEventListener('submit', function(event) {
  const inputs = event.target.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    if (input.offsetParent === null) {
      input.removeAttribute('required'); // Remove required if hidden
    }

    if (input.name === 'phoneNumber') {
      input.value = input.value.replace(/\D/g, ''); // Keep only digits
    }

    if (!input.value.trim()) {
      input.parentNode.removeChild(input);
    }
  });
});

// Toggle between each type of legal entity (business or individual) in the signup form
document.body.addEventListener('change', function(e) {

  if (e.target.name === 'accountType') {
    clearFormFields();
    toggleAthleteSection();

    // Show the correct header for the select legal entity
    const headerPrefix = e.target.value === 'individual' ? 'Personal' : 'Company';
    document.querySelector('.vendor-header#account-info').innerText = `${headerPrefix} information`;

    // Show any fields that apply to the new vendor type
    const vendorInfoRows = document.querySelectorAll('.vendor-info');
    vendorInfoRows.forEach(function(row) {
      const shouldShow = row.classList.contains(e.target.value);
      row.classList.toggle('hidden', !shouldShow);
      const input = row.querySelector('input, select, textarea'); // Adjust selector if needed
      if (input) {
        if (shouldShow) {
          input.setAttribute('required', ''); // Make it required if visible
        } else {
          input.removeAttribute('required'); // Remove required if hidden
        }
      }
    });
  }
});

document.body.addEventListener('input', function(e) {

  if (e.target.name !== 'phoneNumber') { return; }

  if (e.target.name === 'phoneNumber') {
    updatePhoneInput()
    return;
  }
});

// Enable sequence of annotation cards on the Dashboard
const dashboardAnnotation = document.querySelector('.annotation.dashboard-banner button.next');
if (dashboardAnnotation !== null) {
  dashboardAnnotation.addEventListener('click', function(e) {
    e.preventDefault();
    document
      .querySelector('.annotation.dashboard-banner')
      .classList.toggle('hidden');
    document
      .querySelector('.annotation.dashboard-simulate')
      .classList.toggle('hidden');
  }); 
}

// In mobile / responsive mode, toggle showing details on annotation cards
document.querySelectorAll('.annotation.card').forEach(function(card) {
  card.querySelector('h4').addEventListener('click', function(e) {
    card.querySelector('a.show-more').classList.toggle('expanded');
    card.querySelector('.description').classList.toggle('expanded');
  });
});

function updatePhoneInput() {
  let accountType;
  const accountTypes = document.getElementsByName('accountType');
  accountTypes.forEach(radio => { if (radio.checked) { accountType = radio.value; } });
  const phoneInput = document.getElementById(`phone-${accountType}`);
  if (phoneInput) {
    const input = phoneInput;
    let cleaned = input.value.replace(/\D/g, ''); // Remove all non-digit characters

    // Format based on the length of the cleaned input
    if (cleaned.length <= 3) {
      cleaned = `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      cleaned = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      cleaned = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    input.value = cleaned;
  }
}

function clearFormFields() {
  const form = document.querySelector('form'); // Target the form element

  // Loop through each form element and reset its value, except account type
  form.querySelectorAll('input, select, textarea').forEach(field => {
    // Skip clearing for account type radio buttons
    if (field.name === 'accountType') return;
    if (field.type === 'submit') return;

    // Clear the value based on field type
    if (field.type === 'radio' || field.type === 'checkbox') {
      field.checked = false;
    } else {
      field.value = ''; // Clear text, number, and select inputs
    }
  });
}

function toggleAthleteSection() {
  const athleteSection = document.getElementById('athlete-section');
  const individualRadio = document.getElementById('po-individual');
  athleteSection.classList.toggle('hidden', !individualRadio.checked);
}
