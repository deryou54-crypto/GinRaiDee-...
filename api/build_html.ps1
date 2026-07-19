$utf8 = [System.Text.Encoding]::UTF8

$foodsDbPath = "c:\Users\User\Documents\GinRaiDee\api\foods_db.json"
$tagsJsonPath = "c:\Users\User\Documents\GinRaiDee\api\tags.json"
$indexHtmlPath = "c:\Users\User\Documents\GinRaiDee\index.html"

$jsonContent = [System.IO.File]::ReadAllText($foodsDbPath, $utf8)
$foods = ConvertFrom-Json $jsonContent

$tagsContent = [System.IO.File]::ReadAllText($tagsJsonPath, $utf8)
$tagsDict = ConvertFrom-Json $tagsContent

$htmlParts = New-Object System.Text.StringBuilder

$meals = @('morning', 'noon', 'evening', 'snack')
foreach ($meal in $meals) {
    if ($null -ne $foods.$meal) {
        foreach ($f in $foods.$meal) {
            $tagsHtml = ""
            if ($null -ne $f.tags) {
                if ($f.tags -is [array]) {
                    foreach ($t in $f.tags) {
                        $c = "green"
                        $prop = $tagsDict.tagColors.PSObject.Properties[$t]
                        if ($null -ne $prop) { $c = $prop.Value }
                        $tagsHtml += "<span class=`"ftag $c`">$t</span>`n"
                    }
                } else {
                    $t = $f.tags
                    $c = "green"
                    $prop = $tagsDict.tagColors.PSObject.Properties[$t]
                    if ($null -ne $prop) { $c = $prop.Value }
                    $tagsHtml += "<span class=`"ftag $c`">$t</span>`n"
                }
            }
            
            $d = $tagsDict.disease
            $b = $tagsDict.bmi
            $s = $tagsDict.symptom
            $bc = $tagsDict.bmic
            
            $tagsHtml += "<span class=`"ftag red dynamic-tag-disease`" style=`"display:none;`">$d</span>`n"
            $tagsHtml += "<span class=`"ftag red dynamic-tag-bmi`" style=`"display:none;`">$b</span>`n"
            $tagsHtml += "<span class=`"ftag green dynamic-tag-symptom`" style=`"display:none;`">$s</span>`n"
            $tagsHtml += "<span class=`"ftag green dynamic-tag-bmic`" style=`"display:none;`">$bc</span>`n"
            
            $imgHtml = ""
            $bgStyle = ""
            if ([string]::IsNullOrEmpty($f.image)) {
                $imgHtml = $f.emoji
                $bgStyle = "linear-gradient(135deg, var(--green-light), #d4f0e2)"
            } else {
                $imgHtml = "<img src=`"$($f.image)`" alt=`"$($f.name)`" style=`"width:100%;height:100%;object-fit:cover;display:block;`">"
                $bgStyle = "none"
            }
            
            $displayStyle = if ($meal -eq 'morning') { 'block' } else { 'none' }
            
            $p = if ($null -ne $f.p) { $f.p } else { 0 }
            $c = if ($null -ne $f.c) { $f.c } else { 0 }
            $fat = if ($null -ne $f.f) { $f.f } else { 0 }
            $sugar = if ($null -ne $f.sugar) { $f.sugar } else { 0 }
            $kcal = if ($null -ne $f.kcal) { $f.kcal } else { "" }
            $desc = if ($null -ne $f.desc) { $f.desc } else { "" }
            $name = if ($null -ne $f.name) { $f.name } else { "" }
            
            $t_check = $tagsDict.check
            $t_protein = $tagsDict.protein
            $t_carb = $tagsDict.carb
            $t_fat = $tagsDict.fat
            $t_sugar = $tagsDict.sugar
            
            $cardHtml = @"
    <div class="food-card" data-meal="$meal" data-name="$name" onclick="toggleFoodSelection('$name', '$meal')" style="display: $displayStyle;">
      <div class="food-img" style="background:$bgStyle">
        <span class="selected-badge" style="display:none;">$t_check</span>
        $imgHtml
        <span class="kcal-badge">$kcal</span>
      </div>
      <div class="food-body">
        <div class="food-name">$name</div>
        <div class="food-desc">$desc</div>
        <div class="food-tags">$tagsHtml</div>
        <div class="nutrient-row" style="margin-top:0.7rem;padding-top:0.6rem;border-top:1px solid var(--border)">
          <div class="ntr"><span class="nval">${p}g</span>$t_protein</div>
          <div class="ntr"><span class="nval">${c}g</span>$t_carb</div>
          <div class="ntr"><span class="nval">${fat}g</span>$t_fat</div>
          <div class="ntr"><span class="nval">${sugar}g</span>$t_sugar</div>
        </div>
      </div>
    </div>
"@
            [void]$htmlParts.AppendLine($cardHtml)
        }
    }
}

$finalHtml = $htmlParts.ToString()

$content = [System.IO.File]::ReadAllText($indexHtmlPath, $utf8)
$startTag = '<div class="food-grid" id="food-grid">'
$endTag = '</div>
  </div>

  <!-- LOGIN MODAL -->'

if ($content.Contains($startTag)) {
    $parts = $content -split [regex]::Escape($startTag)
    $head = $parts[0]
    $tailParts = $parts[1] -split [regex]::Escape('</div>
  </div>

  <!-- LOGIN MODAL -->')
    $tail = $tailParts[1]
    
    $newContent = $head + $startTag + "`n" + $finalHtml + "`n" + $endTag + $tail
    [System.IO.File]::WriteAllText($indexHtmlPath, $newContent, $utf8)
    Write-Host "Successfully updated index.html"
} else {
    Write-Host "Could not find insertion point in index.html"
}
