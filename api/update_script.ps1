$content = [System.IO.File]::ReadAllText("c:\Users\User\Documents\GinRaiDee\script.js", [System.Text.Encoding]::UTF8)
$startStr = "let foods = {"
$endStr = "// Fetch food data from the API"

$startIdx = $content.IndexOf($startStr)
$endIdx = $content.IndexOf($endStr)

if ($startIdx -ge 0 -and $endIdx -ge 0) {
    $head = $content.Substring(0, $startIdx)
    $tail = $content.Substring($endIdx)
    $newContent = $head + "let foods = {};`r`n`r`n" + $tail
    [System.IO.File]::WriteAllText("c:\Users\User\Documents\GinRaiDee\script.js", $newContent, [System.Text.Encoding]::UTF8)
    Write-Host "Updated script.js"
} else {
    Write-Host "Could not find start or end strings"
}
