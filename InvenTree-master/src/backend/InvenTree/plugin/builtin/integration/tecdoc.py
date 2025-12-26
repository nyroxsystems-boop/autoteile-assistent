"""TecDoc Integration Plugin for InvenTree"""

from django.utils.translation import gettext_lazy as _

from plugin import InvenTreePlugin
from plugin.mixins import IntegrationMixin, SettingsMixin


class TecDocIntegrationPlugin(IntegrationMixin, SettingsMixin, InvenTreePlugin):
    """
    Integration plugin for TecDoc Catalogue.
    """

    NAME = 'TecDoc Connector'
    SLUG = 'tecdoc'
    TITLE = _('TecDoc Integration')
    DESCRIPTION = _('Identify parts and vehicles via TecDoc API')
    VERSION = '1.0.0'
    AUTHOR = 'Autoteile Assistent'

    SETTINGS = {
        'API_KEY': {
            'name': _('TecDoc API Key'),
            'description': _('API Key for TecDoc Webservice'),
            'required': True,
        },
        'API_URL': {
            'name': _('TecDoc API URL'),
            'description': _('Base URL for TecDoc API'),
            'default': 'https://webservice.tecalliance.services/pegasus-3-0/services',
        }
    }

    # This plugin serves as a Configuration Provider for Bot Service
    # and potential Part Lookup actions in InvenTree UI in future.
