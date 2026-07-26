function Open-AITab {
    [CmdletBinding()]
    param(
        [Parameter(Position = 0)]
        [string]$Path = (Get-Location).Path
    )

    $resolvedPath = (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path
    $name = Split-Path -Leaf $resolvedPath
    if ([string]::IsNullOrWhiteSpace($name)) {
        $name = $resolvedPath
    }

    $colors = @(
        '#4CC2FF' # Sky blue
        '#7AA2F7' # Periwinkle
        '#C586F7' # Purple
        '#F472B6' # Pink
        '#FF6B6B' # Coral
        '#FF9F43' # Orange
        '#F4C95D' # Gold
        '#6CCB5F' # Green
        '#2DD4BF' # Teal
    )

    $availableColors = @($colors | Where-Object { $_ -ne $global:OpenAITabLastColor })
    $color = Get-Random -InputObject $availableColors
    $global:OpenAITabLastColor = $color

    wt.exe -w 0 new-tab `
        --profile "OpenCode" `
        --title $name `
        --tabColor $color `
        --useApplicationTitle `
        --startingDirectory $resolvedPath
}

Set-Alias -Name oai -Value Open-AITab
