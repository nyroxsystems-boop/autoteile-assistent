import os
from django.db import migrations
from django.conf import settings

def fix_public_tenant_domain(apps, schema_editor):
    Tenant = apps.get_model('tenancy', 'Tenant')
    Domain = apps.get_model('tenancy', 'Domain')
    
    # Define your production domain here or fetch from env
    # Defaulting to the known Render URL if env var is missing
    target_domain = os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'wawi-new.onrender.com')
    
    # Strip protocol if present
    target_domain = target_domain.replace('https://', '').replace('http://', '').strip('/')
    
    print(f"\n[Migration] Attempting to fix public tenant domain to: {target_domain}")

    try:
        # 1. Find the 'public' tenant
        public_tenant = Tenant.objects.get(schema_name='public')
        
        # 2. Check if a domain entry already exists for this tenant
        # We look for ANY domain for public, or specifically the target one
        domain, created = Domain.objects.get_or_create(
            tenant=public_tenant,
            domain=target_domain,
            defaults={'is_primary': True}
        )
        
        if created:
            print(f"[Migration] Created new domain: {target_domain}")
        else:
            print(f"[Migration] Domain {target_domain} already exists.")
            if not domain.is_primary:
                domain.is_primary = True
                domain.save()
                print("[Migration] Set domain as PRIMARY.")
                
        # Optional: Ensure no other domains are primary if we want strictness?
        # For now, just ensuring the correct one exists is enough.

    except Tenant.DoesNotExist:
        print("[Migration] WARNING: 'public' tenant not found. Skipping domain fix (Fresh install?).")
    except Exception as e:
        print(f"[Migration] ERROR: Failed to fix domain: {e}")

def reverse_fix(apps, schema_editor):
    # No-op reverse
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('tenancy', '0004_tenant_max_devices_tenant_max_users_tenantdevice'),
    ]

    operations = [
        migrations.RunPython(fix_public_tenant_domain, reverse_fix),
    ]
