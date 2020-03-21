# PETITION - Free Orcas from the Swimming Pool

## Description

This petition project includes a website where anyone is able to register and sign for a specific cause. The user has to provide credentials to register and has the possibility to provide some more information (age, city, homepage) for his/her user profile voluntarily. The user can then digitally sign the petition. After signing the user is able to see names of everyone who signed the petition already. The signers list includes the age, city and homepage of the specific users if provided. For users who provided a homepage, their names in the signers list will link to their homepage. Clicking on a city in the signers list will redirect to a list with signers from this city only. The user can login/logout, update his/her user profile and delete his/her signature or the entire account.

## Key Features

-   Authorization and Authentication
    -   Register/Delete account functionality
    -   LogIn/LogOut through session cookies
    -   Set/change user profile
    -   Access to specific routes based on user data
-   Petition signing
    -   Digital signing through canvas
    -   Sign/Unsign functionality
-   Database
    -   Data storage, retrieving and updating through SQL/Postgre
    -   Application of Redis for caching data (another branch)
-   Security
    -   Password hashing through bcryptjs
    -   Protection againt csrf
    -   Protection againt SQL injection

## Technologies

-   HTML
-   CSS
-   JavaScript
-   JQuery
-   Node.js/Express
-   Handlebars.js
-   Postgre SQL
-   Redis
-   Jest/Supertest

![alt text](public/freeOrcasPetition.gif 'Petition - Free ORCAS')

[Link to Live App](https://free-willy.herokuapp.com/)
