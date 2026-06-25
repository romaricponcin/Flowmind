# FlowMind — Synchronisation Zimbra vers GitHub Gist
# Ce script telecharge le calendrier iCal depuis Zimbra et le pousse dans un Gist prive.
# FlowMind peut ensuite lire ce Gist pour afficher les evenements (sans restriction CORS).
#
# Configuration :
#   $ZIMBRA_URL    : URL iCal de votre calendrier Zimbra
#   $GITHUB_TOKEN  : Token GitHub avec scope "gist" (le meme que FlowMind)
#   $GIST_ID       : Laisser vide au premier lancement (sera cree automatiquement)
#
# Planification :
#   schtasks /create /tn "FlowMind-ZimbraSync" /tr "powershell -ExecutionPolicy Bypass -File '%~dp0sync-zimbra.ps1'" /sc hourly /st 00:00

# ── CONFIGURATION ────────────────────────────────────────────────────
$ZIMBRA_URL   = "https://mail.ac-VOTRE-ACADEMIE.fr/service/home/~/Calendar?fmt=ics"
$GITHUB_TOKEN = "ghp_VOTRE_TOKEN_GITHUB"
$GIST_ID      = ""

# ── Fichier de config local (pour persister le Gist ID) ─────────────
$ConfigFile = Join-Path $PSScriptRoot "sync-zimbra.config"
if (Test-Path $ConfigFile) {
    $saved = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    if ($saved.GistId) { $GIST_ID = $saved.GistId }
    if ($saved.GithubToken) { $GITHUB_TOKEN = $saved.GithubToken }
    if ($saved.ZimbraUrl) { $ZIMBRA_URL = $saved.ZimbraUrl }
}

# ── Telechargement du calendrier Zimbra ──────────────────────────────
Write-Host "[FlowMind] Telechargement du calendrier depuis Zimbra..."
try {
    $icsContent = (Invoke-WebRequest -Uri $ZIMBRA_URL -UseBasicParsing).Content
} catch {
    Write-Host "[FlowMind] ERREUR : Impossible de telecharger le calendrier." -ForegroundColor Red
    Write-Host "  URL : $ZIMBRA_URL"
    Write-Host "  Erreur : $_"
    exit 1
}

Write-Host "[FlowMind] Calendrier telecharge ($(($icsContent).Length) caracteres)."

# ── Push vers GitHub Gist ────────────────────────────────────────────
$headers = @{
    "Authorization" = "token $GITHUB_TOKEN"
    "Content-Type"  = "application/json"
    "User-Agent"    = "FlowMind-ZimbraSync"
}

$body = @{
    description = "FlowMind - calendrier Zimbra (sync automatique)"
    public      = $false
    files       = @{
        "calendar.ics" = @{ content = $icsContent }
    }
} | ConvertTo-Json -Depth 4

if ($GIST_ID) {
    $url = "https://api.github.com/gists/$GIST_ID"
    $method = "PATCH"
} else {
    $url = "https://api.github.com/gists"
    $method = "POST"
}

Write-Host "[FlowMind] Envoi vers GitHub Gist ($method)..."
try {
    $resp = Invoke-RestMethod -Uri $url -Method $method -Headers $headers -Body $body
    $GIST_ID = $resp.id

    # Sauvegarder le Gist ID pour les prochains lancements
    @{ GistId = $GIST_ID; GithubToken = $GITHUB_TOKEN; ZimbraUrl = $ZIMBRA_URL } |
        ConvertTo-Json | Set-Content $ConfigFile -Encoding utf8

    Write-Host "[FlowMind] OK ! Gist ID : $GIST_ID" -ForegroundColor Green
    Write-Host "[FlowMind] Collez cet ID dans FlowMind > Frais pro > Importer depuis Zimbra > Gist ID"
} catch {
    Write-Host "[FlowMind] ERREUR : Impossible de pousser vers le Gist." -ForegroundColor Red
    Write-Host "  Erreur : $_"
    exit 1
}
