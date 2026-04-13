@echo off
cd /d C:\Users\troul\Documents\Claude\BeachFinder
echo ============================================
echo   BEACHFINDER - TOUTES LES REGIONS FRANCE
echo ============================================

echo.
echo [1/3] FR-SE (PACA/Corse)...
conda run python scripts/beach_photo_scraper.py --country FR-SE

echo.
echo [2/3] FR-C (Auvergne/Rhone-Alpes)...
conda run python scripts/beach_photo_scraper.py --country FR-C

echo.
echo [3/3] FR-MED (Occitanie E/Herault)...
conda run python scripts/beach_photo_scraper.py --country FR-MED

echo.
echo ============================================
echo   TOUTES LES REGIONS FRANCE TERMINEES!
echo ============================================
pause
