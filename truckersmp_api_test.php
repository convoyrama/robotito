<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TruckersMP API Connection Test</title>
    <style>
        body { font-family: sans-serif; margin: 2em; background-color: #fdfdfd; color: #333; }
        .container { max-width: 960px; margin: 0 auto; }
        h1 { text-align: center; color: #4a4a4a; }
        .test-case { border: 1px solid #ccc; padding: 1.5em; margin-bottom: 1.5em; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .test-case h2 { margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 0.5em; color: #555; }
        .status { padding: 0.8em 1.2em; border-radius: 5px; color: white; font-weight: bold; margin-bottom: 1em; }
        .success { background-color: #28a745; }
        .failure { background-color: #dc3545; }
        pre { background-color: #f4f4f4; padding: 1em; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ddd; font-family: monospace; }
        strong { color: #c7254e; }
    </style>
</head>
<body>
    <div class="container">
        <h1>TruckersMP API Connection Test</h1>
        <p>This script tests various methods to connect to the TruckersMP API to debug connection issues, which may be related to Cloudflare's protection measures. Upload this file to your server and access it via a web browser.</p>

        <?php
        // Set error reporting for robust debugging.
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);

        // API endpoint and a common browser User-Agent to avoid being blocked.
        $apiUrl = 'https://api.truckersmp.com/v2/servers';
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

        /**
         * Function to render the results of a test case.
         * @param string $title The title of the test.
         * @param bool $isSuccess Whether the test was successful.
         * @param string $message A message describing the outcome.
         * @param array $details An array of details to display in <pre> tags.
         */
        function render_test_case($title, $isSuccess, $message, $details = []) {
            echo '<div class="test-case">';
            echo "<h2>$title</h2>";
            $statusClass = $isSuccess ? 'success' : 'failure';
            $statusText = $isSuccess ? 'Success' : 'Failure';
            echo "<div class='status $statusClass'>$statusText: $message</div>";
            foreach ($details as $key => $value) {
                echo "<h4>$key:</h4>";
                echo '<pre>' . htmlspecialchars($value) . '</pre>';
            }
            echo '</div>';
        }

        // --- Test Case 1: file_get_contents() with User-Agent ---
        $testTitle1 = 'Test 1: `file_get_contents()` with a Browser User-Agent';
        try {
            $context = stream_context_create([
                'http' => [
                    'header' => "User-Agent: $userAgent\r\n" .
                                "Accept: application/json\r\n",
                    'timeout' => 10,
                    'ignore_errors' => true // To read the body on non-200 responses
                ]
            ]);
            $response = file_get_contents($apiUrl, false, $context);
            // $http_response_header is a special variable populated by file_get_contents
            $status_line = $http_response_header[0];
            preg_match('{HTTP/\S*\s(\d{3})}', $status_line, $match);
            $http_code = $match[1];

            if ($response === false || $http_code != 200) {
                $error = error_get_last();
                $errorMessage = "file_get_contents() failed with HTTP status: $http_code.";
                if ($error) {
                    $errorMessage .= " PHP Error: " . $error['message'];
                }
                throw new Exception($errorMessage);
            }
            render_test_case($testTitle1, true, 'Response received successfully.', [
                'HTTP Status' => $http_code,
                'Response Body (decoded)' => json_encode(json_decode($response), JSON_PRETTY_PRINT)
            ]);
        } catch (Exception $e) {
            render_test_case($testTitle1, false, 'Could not retrieve data.', [
                'Error Message' => $e->getMessage(),
                'Response Body (if any)' => isset($response) && $response ? $response : 'No response body.'
            ]);
        }


        // --- Test Case 2: cURL with a Browser User-Agent ---
        $testTitle2 = 'Test 2: cURL with a Browser User-Agent';
        $ch = curl_init();
        try {
            curl_setopt($ch, CURLOPT_URL, $apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);

            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                throw new Exception('cURL error: ' . curl_error($ch));
            }
            if ($http_code !== 200) {
                 throw new Exception("HTTP request failed with status code $http_code.");
            }
            render_test_case($testTitle2, true, "Response received with HTTP status $http_code.", [
                'Response Body (decoded)' => json_encode(json_decode($response), JSON_PRETTY_PRINT)
            ]);
        } catch (Exception $e) {
            render_test_case($testTitle2, false, 'Could not retrieve data.', [
                'Error Message' => $e->getMessage(),
                'HTTP Status' => curl_getinfo($ch, CURLINFO_HTTP_CODE),
                'Response Body (if any)' => isset($response) && $response ? $response : 'No response body.'
            ]);
        } finally {
            curl_close($ch);
        }


        // --- Test Case 3: cURL with Custom Headers & forcing TLSv1.2 ---
        $testTitle3 = 'Test 3: cURL with Custom Headers & forcing TLSv1.2';
        $ch = curl_init();
        try {
            curl_setopt($ch, CURLOPT_URL, $apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Accept-Language: en-US,en;q=0.9',
                'Cache-Control: no-cache',
            ]);
            // Force TLS 1.2
            curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
            curl_setopt($ch, CURLOPT_VERBOSE, true); // Enable verbose output for debugging
            $verbose_log = fopen('php://temp', 'w+');
            curl_setopt($ch, CURLOPT_STDERR, $verbose_log);

            $response = curl_exec($ch);
            $curl_info = curl_getinfo($ch);
            $http_code = $curl_info['http_code'];
            
            rewind($verbose_log);
            $verbose_output = stream_get_contents($verbose_log);
            fclose($verbose_log);

            if (curl_errno($ch)) {
                throw new Exception('cURL error: ' . curl_error($ch));
            }
            if ($http_code !== 200) {
                 throw new Exception("HTTP request failed with status code $http_code.");
            }
            render_test_case($testTitle3, true, "Response received with HTTP status $http_code.", [
                 'SSL Version' => $curl_info['ssl_version'] ?? 'N/A',
                 'Response Body (decoded)' => json_encode(json_decode($response), JSON_PRETTY_PRINT),
                 'cURL Verbose Log' => $verbose_output
            ]);
        } catch (Exception $e) {
            rewind($verbose_log);
            $verbose_output = stream_get_contents($verbose_log);
            fclose($verbose_log);
            render_test_case($testTitle3, false, 'Could not retrieve data.', [
                'Error Message' => $e->getMessage(),
                'HTTP Status' => curl_getinfo($ch, CURLINFO_HTTP_CODE),
                'cURL Verbose Log' => $verbose_output,
                'Response Body (if any)' => isset($response) && $response ? $response : 'No response body.'
            ]);
        } finally {
             if (is_resource($ch)) {
                curl_close($ch);
             }
        }
        ?>
    </div>
</body>
</html>
