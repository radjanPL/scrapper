
export const SetAllPages = async (allPages) => {
    return sendRequest('setAllPages', allPages);
}

const sendRequest = async (link, params) => {       
    const linkApi = createLinkApi();
    const response = await fetch(`${linkApi}${link}`, {
        method : "POST",
        headers: {
            'Content-Type' : 'application/json',
            'X-WP-Nonce' : scrapperSettings.nonce
        },
        body : JSON.stringify({
            params:params
        })
    });
    return response.json();
}

const createLinkApi = () => {
    const patternAdminWp = 'wp-admin/admin.php';
	const currentDir = window.location.pathname.replace(patternAdminWp, '');
    return currentDir+'wp-json/scrapper/v1/main/';
}