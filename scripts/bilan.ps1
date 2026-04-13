$d = 'C:\Users\troul\Documents\Claude\BeachFinder\scripts'
$photos = (Get-ChildItem "$d\photos" -File -ErrorAction SilentlyContinue).Count
Write-Host "Photos: $photos"
Get-ChildItem "$d\beach_data" -Filter *.json | ForEach-Object {
    $cnt = (Get-Content $_.FullName -Raw | ConvertFrom-Json).Count
    Write-Host ($_.Name + ': ' + $cnt + ' plages')
}
