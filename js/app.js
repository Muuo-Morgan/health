// app.js (ES module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ----- CONFIG: Firebase config from the console -----
const firebaseConfig = {
  apiKey: "AIzaSyCnHTWFnBrgTAhrqp3mIwEzIQVBMR8_kdM",
  authDomain: "health-quest-9edb4.firebaseapp.com",
  projectId: "health-quest-9edb4",
  storageBucket: "health-quest-9edb4.firebasestorage.app",
  messagingSenderId: "348057700840",
  appId: "1:348057700840:web:38cb8e29e028152413bc5d"
};
// ---------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exported helper to save contact (used by contact page)
export async function saveContact({ name, email, message }) {
  return await addDoc(collection(db, 'contacts'), {
    name, email, message, createdAt: new Date().toISOString()
  });
}

// Save signup (used on pages)
export async function saveSignup({ name, email, program }) {
  return await addDoc(collection(db, 'users'), {
    name, email, program, createdAt: new Date().toISOString()
  });
}

// Hook donation / payment button(s)
function initPayments() {
  const FLW_PUBLIC = 'FLWPUBK_TEST-0f9dfeb190a568aea8395e980fd04546-X'; // <<<Flutterwave public key
  // attach to any element with id donateTop or payBtn
  const donateTop = document.getElementById('donateTop');
  const payBtn = document.getElementById('payBtn');

  const launch = (amount = 500, email = 'donor@example.com', name = 'Health Quest Supporter') => {
    if (!window.FlutterwaveCheckout && !window.Flutterwave) {
      // load script dynamically if not present
      const s = document.createElement('script');
      s.src = 'https://checkout.flutterwave.com/v3.js';
      s.onload = () => openFlow(amount, email, name);
      document.head.appendChild(s);
    } else openFlow(amount, email, name);
  };

  function openFlow(amount, email, name) {
    FlutterwaveCheckout({
      public_key: FLW_PUBLIC,
      tx_ref: 'healthquest_' + Date.now(),
      amount,
      currency: "KES",
      payment_options: "card,mpesa",
      customer: {
        email,
        phone_number: "+254700000000",
        name
      },
      callback: function(data){
        // Payment succeeded — you should verify on the server (webhook) before marking as paid
        console.log('Payment callback', data);
        alert('Thanks! Payment completed.');
        // Optionally saving the payment record to Firestore:
        addDoc(collection(db,'payments'), { provider: 'flutterwave', tx: data.transaction_id || data.tx_ref, amount, createdAt: new Date().toISOString() });
      },
      onclose: function() {
        console.log('Payment closed');
      }
    });
  }

  if (donateTop) donateTop.addEventListener('click', () => launch(500, 'support@healthquest.org', 'Health Quest Donor'));
  if (payBtn) payBtn.addEventListener('click', () => launch(200, 'donor@example.com', 'Health Quest Donor'));
}

// Attaching small handlers for contact/signup forms on pages that exist
function initForms() {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      await saveSignup({ name, email, program: 'general' });
      alert('Welcome! Your info has been saved.');
      signupForm.reset();
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cname').value;
      const email = document.getElementById('cemail').value;
      const message = document.getElementById('cmessage').value;
      await saveContact({ name, email, message });
      alert('Message sent — thank you.');
      contactForm.reset();
    });
  }

  // doctor profile booking button (if present)
  const bookBtn = document.getElementById('bookBtn');
  if (bookBtn) {
    bookBtn.addEventListener('click', async () => {
      // For demo: create a payment flow and then open booking modal
      const fee = parseInt(document.getElementById('docFee').innerText || '2000', 10);
      if (confirm(`Proceed to pay KES ${fee} to book this consultation?`)) {
        // Trigger Flutterwave flow here (reuse initPayments launch)
        // For simplicity, click payBtn if exists
        const fakePay = document.getElementById('payBtn');
        if (fakePay) fakePay.click();
        else alert('Payment button not found; please configure Flutterwave key.');
      }
    });
  }
}

// doctor profile loader: reads ?doc=.. from query and populates profile
function initDoctorProfile() {
  const params = new URLSearchParams(window.location.search);
  const doc = params.get('doc');
  if (!doc) return;
  // For demo, static mapping
  const docs = {
    amina: { name: 'Dr. Amina K.', img: 'https://randomuser.me/api/portraits/women/65.jpg', bio: 'Clinical psychologist with 8 years experience. Special interest in CBT and trauma-informed care.', specialty: 'Clinical psychologist', fee: 2500 },
    david: { name: 'Dr. David N.', img: 'https://randomuser.me/api/portraits/men/32.jpg', bio: 'Psychiatrist providing telehealth consultations and medication management.', specialty: 'Psychiatry', fee: 3000 },
    grace: { name: 'Dr. Grace M.', img: 'https://randomuser.me/api/portraits/women/12.jpg', bio: 'Counselor focusing on youth and family therapy.', specialty: 'Counselor', fee: 2000 }
  };
  const info = docs[doc];
  if (!info) return;
  document.getElementById('docName').innerText = info.name;
  document.getElementById('docImg').src = info.img;
  document.getElementById('docBio').innerText = info.bio;
  document.getElementById('docSpecialty').innerText = info.specialty;
  document.getElementById('docFee').innerText = info.fee;
}

// Initialize everything on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initPayments();
  initForms();
  initDoctorProfile();
});
