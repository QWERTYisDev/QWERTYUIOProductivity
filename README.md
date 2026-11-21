# System

Solo Leveling style quest tracker. Data lives in your browser (localStorage); use Profile > Export JSON for backups.

    npm install
    npm run dev      # local
    npm run build    # outputs dist/
    npm run check    # types + logic self-check

Deploy: push to GitHub, then Netlify > Add new project > Import from GitHub. Build `npm run build`, publish `dist` (set by netlify.toml).
