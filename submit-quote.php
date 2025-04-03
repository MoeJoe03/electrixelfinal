<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Collect form data
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $phone = htmlspecialchars($_POST['phone'] ?? '');
    $service = htmlspecialchars($_POST['service']);
    $message = htmlspecialchars($_POST['message']);
    
    // Email setup (replace with your details)
    $to = "info@electrixel.co.za";
    $subject = "New Quote Request: $service";
    $body = "Name: $name\nEmail: $email\nPhone: $phone\nService: $service\nMessage:\n$message";
    $headers = "From: $email";
    
    // Send email
    if (mail($to, $subject, $body, $headers)) {
        // Redirect to thank you page
        header('Location: thank-you.html');
        exit();
    } else {
        echo "Error sending message";
    }
}
?>