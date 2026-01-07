# This document is to map out our current set of components and the infrastructure that makes them run.  

## I will also add some new components or structures with the data that they will need and see if our current
    
### New components will be:
- A refactored "what to do with winners" component that will take the best performing asset of a students portfolio and explain profit / tax / cost basis / etc.
- A refactored "what do do with losers" component that explain when to cut losses if reasonable for the students worst performing asset.  

- A completed trading page with current interesting asset picks to help guide students who might not know how to jump into research

- Some function that manages pending trades so that they will try to execute when the market opens; with a time out function if the trade doesn't execute in the given time that the student dictates. with a notification system on the front page that alerts students to the various outcomes.  We will also need to add trades that don't execute because conditions aren't met to the "transactions" component on the main page. 

- An enhanced leaderboard that shows each person on the boards best performing asset; # of trades broken out by buys and sells. We'll also remove the bg and restyle it according to our ui guidelines.

## I'd like to have a visual representation of pages and components so I can add to them and critically think about 

### Bug Fixes

- Make sure all calculations come from one source of truth.  Example of this not happening: current return for portfolioperformancechart.tsx and the dashboard widget showing user stats have slightly different results.  