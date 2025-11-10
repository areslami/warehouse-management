def get_next_sequential_id(model_class, field_name, prefix):
    last_obj = model_class.objects.order_by('-id').first()
    
    if last_obj:
        last_id = getattr(last_obj, field_name)
        if last_id:
            try:
                last_num = int(last_id.split('-')[-1])
                new_num = last_num + 1
            except (ValueError, IndexError):
                new_num = 1
        else:
            new_num = 1
    else:
        new_num = 1
    
    return f"{prefix}-{new_num}"