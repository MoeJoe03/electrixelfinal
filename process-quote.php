<?php
header('Content-Type: application/json');

// Validate inputs
$errors = [];
$data = [];

if (empty($_POST['name'])) {
    $errors['name'] = 'Name is required.';
}

if (empty($_POST['email'])) {
    $errors['email'] = 'Email is required.';
} elseif (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Email is invalid.';
}

if (empty($_POST['service'])) {
    $errors['service'] = 'Please select a service.';
}

if (!empty($errors)) {
    $data['success'] = false;
    $data['errors'] = $errors;
} else {
    // Process the form (replace with your email)
    $to = "your@email.com";
    $subject = "New Quote Request from " . $_POST['name'];
    
    $message = "
    <html>
    <head>
      <title>New Quote Request</title>
    </head>
    <body>
      <h2>Quote Request Details</h2>
      <p><strong>Name:</strong> {$_POST['name']}</p>
      <p><strong>Email:</strong> {$_POST['email']}</p>
      <p><strong>Phone:</strong> {$_POST['phone'] ?? 'Not provided'}</p>
      <p><strong>Company:</strong> {$_POST['company'] ?? 'Not provided'}</p>
      <p><strong>Service:</strong> {$_POST['service']}</p>
      <p><strong>Project Details:</strong></p>
      <p>{$_POST['details']}</p>
    </body>
    </html>
    ";
    
    // Headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: {$_POST['email']}\r\n";
    
    // Send email
    $success = mail($to, $subject, $message, $headers);
    
    if ($success) {
        $data['success'] = true;
        $data['message'] = 'Thank you! We will contact you within 24 hours.';
    } else {
        $data['success'] = false;
        $data['message'] = 'There was a problem sending your request. Please try again.';
    }
}

echo json_encode($data);
?>