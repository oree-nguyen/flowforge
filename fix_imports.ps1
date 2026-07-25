$nodes = Get-ChildItem 'src\components\nodes\*.tsx'
foreach ($f in $nodes) {
    $c = Get-Content $f.FullName -Raw
    $c = $c.Replace("from '../diagram/Handle'", "from '../NodeTypes'")
    [System.IO.File]::WriteAllText($f.FullName, $c)
}
Write-Host "Done"
